import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {

  const currencySymbol = "$";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || false);
  const [userData, setUserData] = useState(false);

  const months = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const slotDateFormat = (slotDate) => {
    if (!slotDate || typeof slotDate !== "string") return "N/A";

    const separator = slotDate.includes('_')
      ? '_'
      : slotDate.includes('-')
      ? '-'
      : slotDate.includes('/')
      ? '/'
      : '';

    if (!separator) return "N/A";

    const parts = slotDate.split(separator);
    if (parts.length !== 3) return "N/A";

    const [year, month, day] = parts;
    const monthIndex = Number(month);

    if (monthIndex < 1 || monthIndex > 12) return "N/A";

    return `${day} ${months[monthIndex]} ${year}`;
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";

    const today = new Date();
    const birthDate = new Date(dob);

    let age = today.getFullYear() - birthDate.getFullYear();

    const beforeBirthday =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate());

    if (beforeBirthday) age--;

    return age;
  };

  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/list`);

      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const loadUserProfileData = async () => {
    if (!token) return null;

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/user/get-profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setUserData(data.userData);
        return data.userData;
      } else {
        setUserData(false);
        setToken(false);
        localStorage.removeItem("token");
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      console.error(error);
      setUserData(false);
      setToken(false);
      localStorage.removeItem("token");
      toast.error("Not Authorized. Login Again");
      return null;
    }
  };

  const classifyUserSymptoms = async (symptomList) => {
    if (!token) {
      toast.error("Please log in to classify symptoms.");
      return null;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/classify-symptoms`,
        { symptoms: symptomList },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        return data.data; 
      } else {
        toast.error(data.message || "Could not classify symptoms.");
        return null;
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to classify symptoms. Server error.");
      return null;
    }
  };

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData,
    slotDateFormat,
    calculateAge,
    classifyUserSymptoms, 
  };

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
