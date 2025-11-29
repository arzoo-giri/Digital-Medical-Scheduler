import express from 'express';
import { 
    doctorList, 
    loginDoctor, 
    appointmentsDoctor, 
    appointmentComplete, 
    appointmentCancel, 
    doctorDashboard, 
    doctorProfile, 
    updateDoctorProfile
} from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js';
import { addSlot, removeSlot, getSlotsByDate } from '../controllers/doctorScheduleController.js';

const doctorRouter = express.Router();

doctorRouter.get('/list', doctorList);
doctorRouter.post('/login', loginDoctor);
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor);
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete);
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancel);
doctorRouter.get('/dashboard', authDoctor, doctorDashboard);
doctorRouter.get('/profile', authDoctor, doctorProfile);
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile);

doctorRouter.post("/schedule/add-slot", authDoctor, addSlot);
doctorRouter.post("/schedule/remove-slot", authDoctor, removeSlot);

doctorRouter.post("/schedule/get-slots", getSlotsByDate);

export default doctorRouter;
