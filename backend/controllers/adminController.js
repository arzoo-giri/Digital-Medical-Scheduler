import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";

const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;

    const imageFile = req.file;

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentsAdmin = async (req, res) => {
  try {
    let appointments = await appointmentModel
      .find({})
      .sort({ _id: -1 })
      .populate("userId", "name image dob")
      .populate("docId", "name image speciality fees");

    appointments = await Promise.all(
      appointments.map(async (app) => {
        const doc = app._doc || app;

        let docData =
          doc.docData && typeof doc.docData === "object" ? doc.docData : null;

        if (!docData && doc.docId && typeof doc.docId === "object") {
          docData = doc.docId;
        }

        if (!docData && doc.docId) {
          const fetchedDoc = await doctorModel
            .findById(doc.docId)
            .select("name image speciality fees");
          if (fetchedDoc) docData = fetchedDoc.toObject();
        }

        let userData =
          doc.userData && typeof doc.userData === "object" ? doc.userData : null;

        if (!userData && doc.userId && typeof doc.userId === "object") {
          userData = doc.userId;
        }

        if (!userData && doc.userId) {
          const fetchedUser = await userModel
            .findById(doc.userId)
            .select("name image dob");
          if (fetchedUser) userData = fetchedUser.toObject();
        }

        let slotDate = doc.slotDate || null;
        let slotTime = doc.slotTime || null;

        if (!slotDate || !slotTime) {
          if (doc.slotData && typeof doc.slotData === "string") {
            const parts = doc.slotData.split("_");
            if (parts.length >= 4) {
              slotDate = `${parts[0]}/${parts[1]}/${parts[2]}`;
              slotTime = parts.slice(3).join("_");
            } else if (parts.length === 3) {
              slotDate = parts.join("/");
            }
          }
        }

        const amount =
          doc.amount ?? (docData && docData.fees ? docData.fees : 0);

        return {
          ...doc,
          docData: docData || {},
          userData: userData || {},
          slotDate: slotDate || "",
          slotTime: slotTime || "",
          amount,
        };
      })
    );

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    const { docId, slotDate, slotTime } = appointmentData;

    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const adminDashboard = async (req, res) => {
  try {
    const doctorsCount = await doctorModel.countDocuments();
    const usersCount = await userModel.countDocuments();
    const appointmentsList = await appointmentModel.find({});

    let latestApps = await appointmentModel
      .find({})
      .sort({ _id: -1 })
      .limit(5)
      .populate("userId", "name image dob")
      .populate("docId", "name image speciality fees");

    const latestAppointments = await Promise.all(
      latestApps.map(async (app) => {
        const doc = app._doc || app;

        let docData =
          doc.docData && typeof doc.docData === "object" ? doc.docData : null;

        if (!docData && doc.docId && typeof doc.docId === "object") {
          docData = doc.docId;
        }

        if (!docData && doc.docId) {
          try {
            const fetchedDoc = await doctorModel
              .findById(doc.docId)
              .select("name image speciality fees address");
            if (fetchedDoc) docData = fetchedDoc.toObject();
          } catch (e) {}
        }

        let userData =
          doc.userData && typeof doc.userData === "object" ? doc.userData : null;

        if (!userData && doc.userId && typeof doc.userId === "object") {
          userData = doc.userId;
        }

        if (!userData && doc.userId) {
          try {
            const fetchedUser = await userModel
              .findById(doc.userId)
              .select("name image dob");
            if (fetchedUser) userData = fetchedUser.toObject();
          } catch (e) {}
        }

        let slotDate = doc.slotDate || null;
        let slotTime = doc.slotTime || null;

        if (!slotDate || !slotTime) {
          if (doc.slotData && typeof doc.slotData === "string") {
            const parts = doc.slotData.split("_");
            if (parts.length >= 4) {
              slotTime = parts.slice(3).join("_");
              slotDate = `${parts[0]}/${parts[1]}/${parts[2]}`;
            } else if (parts.length === 3) {
              slotDate = parts.join("/");
            }
          }
        }

        const amount =
          doc.amount ?? (docData && docData.fees ? docData.fees : 0);

        return {
          ...doc,
          docData: docData || {},
          userData: userData || {},
          slotDate: slotDate || "",
          slotTime: slotTime || "",
          amount,
        };
      })
    );

    const dashData = {
      doctors: doctorsCount,
      patients: usersCount,
      appointments: appointmentsList.length,
      latestAppointments,
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
};
