import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  fee: { type: Number, required: true },
  booked: { type: Boolean, default: false },
});

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String, required: true },
  speciality: { type: String, required: true },
  degree: { type: String, required: true },
  experience: { type: String, required: true },
  about: { type: String, required: true },
  available: { type: Boolean, default: true },
  fees: { type: Number, required: true },
  address: { type: Object, required: true },
  date: { type: Number, required: true },
  slots_booked: { type: Map, of: [slotSchema], default: {} }, 
}, { minimize: false });

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;
