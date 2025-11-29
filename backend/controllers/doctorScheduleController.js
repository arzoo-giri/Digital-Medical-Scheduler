import doctorModel from "../models/doctorModel.js";

const getDateKey = (date) => {
    if (date instanceof Date) {
        return date.toISOString().split("T")[0];
    }
    return date;
};

export const addSlot = async (req, res) => {
    try {
        const { date, startTime, endTime, fee } = req.body;
        const doctorId = req.docId;

        if (!date || !startTime || !endTime || !fee || !doctorId) {
            return res.status(400).json({ success: false, message: "Authentication failed or required fields are missing" });
        }

        const dateKey = getDateKey(date);

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

        if (!doctor.slots_booked) doctor.slots_booked = new Map();

        const existingSlots = doctor.slots_booked.get(dateKey) || [];
        existingSlots.push({ startTime, endTime, fee: Number(fee), booked: false });
        doctor.slots_booked.set(dateKey, existingSlots);

        await doctor.save();

        return res.json({ success: true, message: "Slot added successfully" });
    } catch (error) {
        console.error("Error adding slot:", error);
        return res.status(500).json({ success: false, message: "Failed to add slot" });
    }
};

export const removeSlot = async (req, res) => {
    try {
        const { date, slotIndex } = req.body;
        const doctorId = req.docId;

        if (!date || slotIndex === undefined || !doctorId) {
            return res.status(400).json({ success: false, message: "Authentication failed or required fields are missing" });
        }

        const dateKey = getDateKey(date);

        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

        const slots = doctor.slots_booked.get(dateKey) || [];
        if (slotIndex >= slots.length) {
            return res.status(404).json({ success: false, message: "Slot index out of bounds" });
        }
        slots.splice(slotIndex, 1); 

        doctor.slots_booked.set(dateKey, slots);

        await doctor.save();

        return res.json({ success: true, message: "Slot removed successfully" });
    } catch (error) {
        console.error("Error removing slot:", error);
        return res.status(500).json({ success: false, message: "Failed to remove slot" });
    }
};

export const getSlotsByDate = async (req, res) => {
    try {
        const { date, docId } = req.body;

        if (!date || !docId) return res.status(400).json({ success: false, message: "Date and Doctor ID are required" });

        const dateKey = getDateKey(date);

        const doctor = await doctorModel.findById(docId); 
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

        const slots = (doctor.slots_booked.get(dateKey) || []).map(slot => ({
  startTime: slot.startTime,
  endTime: slot.endTime,
  fee: slot.fee,
  booked: slot.booked
}));


        return res.json({ success: true, slots });
    } catch (error) {
        console.error("Error fetching slots:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch slots" });
    }
};
