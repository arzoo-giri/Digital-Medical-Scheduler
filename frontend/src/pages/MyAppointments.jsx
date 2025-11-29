import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const slotDateFormat = (dateString) => {
    if (!dateString || typeof dateString !== "string") return "-";

    const separator = dateString.includes("_") ? "_" 
                     : dateString.includes("-") ? "-" 
                     : dateString.includes("/") ? "/" 
                     : "";
    if (!separator) return "-";

    const dateParts = dateString.split(separator);
    if (dateParts.length !== 3) return "-";

    const year = dateParts[0];
    const monthIndex = Number(dateParts[1]);
    const day = dateParts[2];

    if (monthIndex < 1 || monthIndex > 12) return "-";

    return `${day} ${months[monthIndex]} ${year}`;
  };

  // Extract correct date from item
  const getDisplayDate = (item) => {
    let dateStringForFormat = item.slotDate || "";
    if (!dateStringForFormat && item.slotData) {
      dateStringForFormat = item.slotData.includes("_")
        ? item.slotData.split("_").slice(0, 3).join("/")
        : item.slotData;
    }
    return dateStringForFormat ? slotDateFormat(dateStringForFormat) : "N/A";
  };

  const getUserAppointments = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) setAppointments(data.appointments.reverse());
      else toast.error(data.message);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!token) return;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else toast.error(data.message);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (token) getUserAppointments();
  }, [token]);

  if (loading) return <p>Loading appointments...</p>;

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">My appointments</p>

      {appointments.length === 0 ? (
        <p className="text-gray-500 mt-4">No appointments found.</p>
      ) : (
        appointments.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
          >
            {/* Doctor Image */}
            <div>
              <img
                className="w-32 bg-indigo-50"
                src={item.docData?.image || ""}
                alt={item.docData?.name || "Doctor"}
              />
            </div>

            {/* Appointment Info */}
            <div className="flex-1 text-sm text-zinc-600">
              <p className="text-neutral-800 font-semibold">{item.docData?.name || "-"}</p>
              <p>{item.docData?.speciality || "-"}</p>
              <p className="text-zinc-700 font-medium mt-1">Address:</p>
              <p className="text-xs">{item.docData?.address?.line1 || "-"}</p>
              <p className="text-xs">{item.docData?.address?.line2 || "-"}</p>
              <p className="text-xs mt-1">
                <span className="text-sm text-neutral-700 font-medium">Date & Time:</span>{" "}
                {getDisplayDate(item)} | {item.slotTime || "-"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 justify-end">
              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 rounded hover:bg-red-600 hover:text-white transition-all duration-300 cursor-pointer"
                >
                  Cancel appointment
                </button>
              )}

              {item.cancelled && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border-red-500 rounded text-red-500">
                  Appointment Cancelled
                </button>
              )}

              {item.isCompleted && (
                <button className="sm:min-w-48 border border-green-500 rounded text-green-500">
                  Completed
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyAppointments;
