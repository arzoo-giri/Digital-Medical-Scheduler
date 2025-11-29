// doctorcontroller.js (CORRECTED)

import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";

const parseSlotData = (slotDate, slotTime, slotData) => {
  if (slotDate && slotTime) return { slotDate, slotTime };

  if (slotData && typeof slotData === "string") {
    const parts = slotData.split("_");

    if (parts.length >= 4) {
      const d = `${parts[0]}/${parts[1]}/${parts[2]}`;
      const t = parts.slice(3).join("_");
      return { slotDate: d, slotTime: t };
    }

    if (parts.length === 3) {
      const d = parts.join("/");
      return { slotDate: d, slotTime: slotTime || null };
    }
  }

  return { slotDate: slotDate || null, slotTime: slotTime || null };
};

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body; 

    const docData = await doctorModel.findById(docId);
    if (!docData)
      return res.json({ success: false, message: "Doctor not found" });

    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });

    res.json({ success: true, message: "Availability Changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await doctorModel.findOne({ email });
    if (!doctor)
      return res.json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch)
      return res.json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.docId; 
    if (!docId)
      return res.status(401).json({ success: false, message: "Unauthorized: docId missing" });

    const rawAppointments = await appointmentModel
      .find({ docId })
      .sort({ date: -1 });

    const appointments = await Promise.all(
      rawAppointments.map(async (app) => {
        let userData =
          app.userData && typeof app.userData === "object"
            ? app.userData
            : null;

        if (!userData && app.userId) {
          const u = await userModel
            .findById(app.userId)
            .select("name image dob");
          if (u) userData = u.toObject();
        }

        if (!userData) userData = { name: "Unknown", image: "" };

        const parsed = parseSlotData(app.slotDate, app.slotTime, app.slotData);

        return {
          ...app._doc,
          userData,
          slotDate: parsed.slotDate || null,
          slotTime: parsed.slotTime || null,
        };
      })
    );

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentComplete = async (req, res) => {
  try {
    const docId = req.docId; 
    const { appointmentId } = req.body; 

    if (!docId || !appointmentId) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId.toString() === docId.toString()) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      return res.json({ success: true, message: "Appointment Completed" });
    }

    res.json({ success: false, message: "Mark Failed: Appointment not found or does not belong to this doctor." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentCancel = async (req, res) => {
  try {
    const docId = req.docId; 
    const { appointmentId } = req.body; 

    if (!docId || !appointmentId) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId.toString() === docId.toString()) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      return res.json({ success: true, message: "Appointment Cancelled" });
    }

    res.json({ success: false, message: "Cancellation Failed: Appointment not found or does not belong to this doctor." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorDashboard = async (req, res) => {
  try {
    const docId = req.docId; 

    const rawAppointments = await appointmentModel
      .find({ docId })
      .sort({ date: -1 });

    let earnings = 0;
    const patientsSet = new Set();

    const latestAppointments = await Promise.all(
      rawAppointments.slice(0, 5).map(async (app) => {
        if (app.isCompleted || app.payment) earnings += app.amount;
        if (app.userId) patientsSet.add(app.userId.toString());

        let userData =
          app.userData && typeof app.userData === "object"
            ? app.userData
            : null;

        if (!userData && app.userId) {
          const u = await userModel
            .findById(app.userId)
            .select("name image dob");
          if (u) userData = u.toObject();
        }

        if (!userData) userData = { name: "Unknown", image: "" };

        const parsed = parseSlotData(app.slotDate, app.slotTime, app.slotData);

        return {
          ...app._doc,
          userData,
          slotDate: parsed.slotDate || null,
          slotTime: parsed.slotTime || null,
        };
      })
    );

    const dashData = {
      earnings,
      appointments: rawAppointments.length,
      patients: patientsSet.size,
      latestAppointments,
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorProfile = async (req, res) => {
  try {
    const docId = req.docId; 

    const profileData = await doctorModel
      .findById(docId)
      .select("-password");
      
    if (!profileData)
      return res.status(404).json({ success: false, message: "Doctor profile not found." });

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.docId; 
    const { fees, address, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, {
      fees,
      address,
      available,
    });

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
};