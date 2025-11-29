import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

import {
    generateAvailableSlots,
    classifyCondition,
    calculatePriorityScore
} from "../utils/classificationAndPriority.js";


const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.json({ success: false, message: "Missing details" });

        if (!validator.isEmail(email))
            return res.json({ success: false, message: "Enter a valid email" });

        if (password.length < 8)
            return res.json({ success: false, message: "Enter a strong password" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user)
            return res.json({ success: false, message: "User does not exist" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const userData = await userModel.findById(userId).select("-password");

        res.json({ success: true, userData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        if (!name || !phone || !dob || !gender)
            return res.json({ success: false, message: "Data missing" });

        const parsedAddress =
            typeof address === "string" ? JSON.parse(address) : address;

        await userModel.findByIdAndUpdate(userId, {
            name,
            phone,
            address: parsedAddress,
            dob,
            gender
        });

        if (imageFile) {
            const upload = await cloudinary.uploader.upload(imageFile.path, {
                resource_type: "image"
            });
            await userModel.findByIdAndUpdate(userId, { image: upload.secure_url });
        }

        res.json({ success: true, message: "Profile updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


const classifySymptoms = async (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0)
            return res.status(400).json({
                success: false,
                message: "Symptoms array is required."
            });

        const { diagnosis, specialty } = classifyCondition(symptoms);
        const priorityScore = calculatePriorityScore(symptoms);

        let priorityLevel = "Low";
        if (priorityScore >= 10) priorityLevel = "High";
        else if (priorityScore >= 5) priorityLevel = "Medium";

        return res.json({
            success: true,
            data: {
                diagnosis,
                specialty,
                priorityScore,
                priorityLevel
            }
        });
    } catch (error) {
        console.error("Error classifying symptoms:", error);
        return res.status(500).json({
            success: false,
            message: "Classification failed."
        });
    }
};


const bookAppointment = async (req, res) => {
    try {
        const userId = req.userId;
        const { doctorId, slotTime, slotDate, symptoms, amount } = req.body;

        if (!doctorId || !slotDate || !slotTime)
            return res.status(400).json({
                success: false,
                message: "Doctor ID, slotDate and slotTime are required"
            });

        const dateKey = new Date(slotDate).toISOString().split("T")[0];

        const doctor = await doctorModel.findOne({
            _id: doctorId,
            slots_booked: { $exists: true }
        });

        if (!doctor || !doctor.available)
            return res.json({ success: false, message: "Doctor not found or not available" });

        const slots = doctor.slots_booked.get(dateKey) || [];

        const slotIndex = slots.findIndex(
            (s) => s.startTime === slotTime && s.booked === false
        );

        if (slotIndex === -1) {
            return res.json({
                success: false,
                message: "Slot not available or already booked"
            });
        }

        const updatePath = `slots_booked.${dateKey}.${slotIndex}.booked`;

        const updateResult = await doctorModel.updateOne(
            { _id: doctorId, [updatePath]: false },
            { $set: { [updatePath]: true } }
        );

        if (updateResult.modifiedCount === 0) {
            return res.json({
                success: false,
                message: "Slot already booked. Please select another time."
            });
        }

        const updatedDoctor = await doctorModel.findById(doctorId);
        const updatedSlots = updatedDoctor.slots_booked.get(dateKey);
        const bookedSlot = updatedSlots[slotIndex];

        let priorityScore = 0;
        let priorityLevel = "Low";

        if (Array.isArray(symptoms) && symptoms.length > 0) {
            priorityScore = calculatePriorityScore(symptoms);
            if (priorityScore >= 10) priorityLevel = "High";
            else if (priorityScore >= 5) priorityLevel = "Medium";
        }

        const userData = await userModel.findById(userId).select("-password");

        const newAppointment = new appointmentModel({
            userId,
            docId: doctorId,
            userData,
            docData: {
                _id: updatedDoctor._id,
                name: updatedDoctor.name,
                image: updatedDoctor.image,
                speciality: updatedDoctor.speciality,
                address: updatedDoctor.address,
                fees: updatedDoctor.fees
            },
            amount: bookedSlot.fee || amount,
            slotDate: dateKey,
            slotTime,
            symptoms,
            priorityScore,
            priorityLevel,
            date: Date.now()
        });

        await newAppointment.save();

        res.json({
            success: true,
            message: "Appointment Booked",
            appointment: newAppointment
        });

    } catch (error) {
        console.error("Error in bookAppointment:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error during booking"
        });
    }
};


const listAppointment = async (req, res) => {
    try {
        const userId = req.userId;

        let appointments = await appointmentModel
            .find({ userId })
            .sort({ date: -1 });

        appointments = await Promise.all(
            appointments.map(async (app) => {
                let docData = app.docData;

                if (!docData || !docData.name) {
                    const doctor = await doctorModel
                        .findById(app.docId)
                        .select("_id name image speciality address fees");
                    docData = doctor ? doctor.toObject() : {};
                }

                return {
                    ...app._doc,
                    docData,
                    userData: app.userData || {},
                    symptoms: app.symptoms || [],
                    priorityLevel: app.priorityLevel || "Low"
                };
            })
        );

        res.json({ success: true, appointments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


const cancelAppointment = async (req, res) => {
    try {
        const userId = req.userId;
        const { appointmentId } = req.body;

        const appointment = await appointmentModel.findById(appointmentId);

        if (!appointment)
            return res.json({ success: false, message: "Appointment not found" });

        if (appointment.userId.toString() !== userId)
            return res.json({ success: false, message: "Unauthorized" });

        const { docId, slotDate, slotTime } = appointment;

        const doctor = await doctorModel.findById(docId);
        if (!doctor)
            return res.json({ success: false, message: "Doctor not found" });

        const dateKey = new Date(slotDate).toISOString().split("T")[0];
        const slots = doctor.slots_booked.get(dateKey) || [];

        const slotIndex = slots.findIndex((s) => s.startTime === slotTime);

        if (slotIndex !== -1) {
            const updatePath = `slots_booked.${dateKey}.${slotIndex}.booked`;

            await doctorModel.updateOne(
                { _id: docId, [updatePath]: true },
                { $set: { [updatePath]: false } }
            );
        }

        appointment.cancelled = true;
        await appointment.save();

        res.json({ success: true, message: "Appointment Cancelled" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};


export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    classifySymptoms,
    bookAppointment,
    listAppointment,
    cancelAppointment
};
