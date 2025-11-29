import React, { useState, useEffect, useContext } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../../../frontend/src/assets/assets";

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (aToken) getAllAppointments();
  }, [aToken]);

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll">
        {/* Header Row */}
        <div className="hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6">
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {/* Appointment Rows */}
        {appointments && appointments.length > 0 ? (
          appointments.map((item, index) => (
            <div
              key={index}
              className="flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 hover:bg-gray-50"
            >
              <p className="max-sm:hidden">{index + 1}</p>

              {/* Patient Info */}
              <div className="flex items-center gap-2">
                <img
                  className="w-8 rounded-full"
                  src={item.userData?.image || assets.default_user_image}
                  alt={item.userData?.name || "User"}
                />
                <p>{item.userData?.name || "N/A"}</p>
              </div>

              {/* Age */}
              <p className="max-sm:hidden">
                {item.userData?.dob ? calculateAge(item.userData.dob) : "N/A"}
              </p>

              {/* Date & Time */}
              <p>
                {(() => {
                  let dateStringForFormat = item.slotDate || "";

                  if (!dateStringForFormat && item.slotData) {
                    if (item.slotData.includes("_")) {
                      // If slot ID format, extract YYYY/MM/DD
                      dateStringForFormat = item.slotData.split("_").slice(0, 3).join("/");
                    } else {
                      dateStringForFormat = item.slotData;
                    }
                  }

                  return dateStringForFormat ? slotDateFormat(dateStringForFormat) : "N/A";
                })()}
                , {item.slotTime || "N/A"}
              </p>

              {/* Doctor Info */}
              <div className="flex items-center gap-2">
                <img
                  className="w-8 rounded-full bg-gray-200"
                  src={item.docData?.image || assets.default_doctor_image}
                  alt={item.docData?.name || "Doctor"}
                />
                <p>{item.docData?.name || "N/A"}</p>
              </div>

              {/* Fees */}
              <p>
                {currency}
                {item.amount || 0}
              </p>

              {/* Status / Action */}
              {item.cancelled ? (
                <p className="text-red-500 text-xs font-medium">Cancelled</p>
              ) : item.isCompleted ? (
                <p className="text-green-500 text-xs font-medium">Completed</p>
              ) : (
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className="w-10 cursor-pointer"
                  src={assets.cancel_icon}
                  alt="Cancel Appointment"
                />
              )}
            </div>
          ))
        ) : (
          <p className="p-6 text-gray-500">No appointments found.</p>
        )}
      </div>
    </div>
  );
};

export default AllAppointments;
