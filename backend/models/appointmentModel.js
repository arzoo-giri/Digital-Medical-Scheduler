import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },

  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },

  userData: { type: Object, required: true },
  docData: { type: Object, required: true },

  amount: { type: Number, required: true },

  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },

  symptoms: { type: [String], default: [] },
  priorityScore: { type: Number, default: 0 },
  priorityLevel: { type: String, enum: ["Low", "Medium", "High"], default: "Low" }
});

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
