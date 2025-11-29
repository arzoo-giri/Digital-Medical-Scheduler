import { useState, createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [dToken, setDToken] = useState(localStorage.getItem("dToken") || "");
    const [appointments, setAppointments] = useState([]);
    const [dashData, setDashData] = useState(false);
    const [profileData, setProfileData] = useState(null);

    const getAppointments = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/doctor/appointments`,
                {
                    headers: { dtoken: dToken },
                }
            );
            if (data.success) setAppointments(data.appointments);
            else toast.error(data.message);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const completeAppointment = async (appointmentId) => {
        try {
            const profile = await loadProfileIfNeeded();
            const { data } = await axios.post(
                `${backendUrl}/api/doctor/complete-appointment`,
                { appointmentId, docId: profile._id }, 
                { headers: { dtoken: dToken } }
            );
            if (data.success) {
                toast.success(data.message);
                getAppointments();
                getDashData();
            } else toast.error(data.message);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const cancelAppointment = async (appointmentId) => {
        try {
            const profile = await loadProfileIfNeeded();
            const { data } = await axios.post(
                `${backendUrl}/api/doctor/cancel-appointment`,
                { appointmentId, docId: profile._id }, 
                { headers: { dtoken: dToken } }
            );
            if (data.success) {
                toast.success(data.message);
                getAppointments();
                getDashData();
            } else toast.error(data.message);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const getDashData = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard`, {
                headers: { dtoken: dToken },
            });
            if (data.success) {
                const dash = {
                    ...data.dashData,
                    latestAppointments: data.dashData.latestAppointments.map((item) => ({
                        ...item,
                        slotDate: item.slotDate || "N/A",
                        userData: item.userData || { name: "Unknown", image: "" },
                    })),
                };
                setDashData(dash);
            } else toast.error(data.message);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const getProfileData = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/doctor/profile`, {
                headers: { dtoken: dToken },
            });
            if (data.success) {
                setProfileData(data.profileData);
                return data.profileData;
            }
            toast.error(data.message || "Failed to load doctor profile");
            return null;
        } catch (err) {
            toast.error("Failed to load doctor profile");
            return null;
        }
    };

    const loadProfileIfNeeded = async () => {
        let currentProfile = profileData;

        if (!currentProfile?._id) {
            try {
                const profile = await getProfileData();
                
                if (!profile?._id) {
                    throw new Error("Doctor profile not available.");
                }
                currentProfile = profile;
            } catch (error) {
                throw error; 
            }
        }
        
        if (!currentProfile?._id) {
            throw new Error("Doctor profile not loaded.");
        }

        return currentProfile; 
    };

    const getSlotsByDate = async (date) => {
        try {
            const profile = await loadProfileIfNeeded();
            const { data } = await axios.post(
                `${backendUrl}/api/doctor/schedule/get-slots`,
                { date, docId: profile._id }, 
                { headers: { dtoken: dToken } } 
            );
            if (data.success) return data.slots;
            toast.error(data.message);
            return [];
        } catch (err) {
            return [];
        }
    };

    const addSlot = async (date, startTime, endTime, fee) => {
        const numericFee = Number(fee);
        
        try {
            if (numericFee <= 0) {
                toast.error("Fee must be greater than zero.");
                return;
            }

            const profile = await loadProfileIfNeeded(); 

            const payload = {
                docId: profile._id, 
                date,
                startTime,
                endTime,
                fee: numericFee, 
            };

            const { data } = await axios.post(
                `${backendUrl}/api/doctor/schedule/add-slot`,
                payload,
                { headers: { dtoken: dToken } }
            );

            if (data.success) {
                toast.success("Slot added successfully");
            } else {
                toast.error(data.message || "Failed to add slot (No message returned).");
            }
            return data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const serverMessage = error.response.data?.message || `API Error: ${error.response.status} (${error.response.statusText})`;
                toast.error(serverMessage); 
            } else {
                toast.error(error.message || "An unknown network error occurred.");
            }
            throw error; 
        }
    };

    const removeSlot = async (date, slotIndex) => {
        try {
            const profile = await loadProfileIfNeeded();
            const { data } = await axios.post(
                `${backendUrl}/api/doctor/schedule/remove-slot`,
                { docId: profile._id, date, slotIndex },
                { headers: { dtoken: dToken } }
            );
            if (data.success) toast.success("Slot removed");
            else toast.error(data.message);
            return data;
        } catch (err) {
             if (axios.isAxiosError(err) && err.response) {
                toast.error(err.response.data.message || `API Error: ${err.response.status}`);
            } else {
                toast.error(err.message || "An unknown error occurred while removing the slot.");
            }
            throw err;
        }
    };

    return (
        <DoctorContext.Provider
            value={{
                dToken,
                setDToken,
                backendUrl,

                appointments,
                setAppointments,
                getAppointments,
                completeAppointment,
                cancelAppointment,

                dashData,
                getDashData,

                profileData,
                getProfileData,

                getSlotsByDate,
                addSlot,
                removeSlot,
            }}
        >
            {props.children}
        </DoctorContext.Provider>
    );
};

export default DoctorContextProvider;