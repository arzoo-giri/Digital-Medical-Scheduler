import React, { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const DoctorAppointment = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
  } = useContext(DoctorContext);

  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (dToken) getAppointments();
  }, [dToken]);

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-2 py-3 px-6 border-b bg-gray-100 font-medium text-gray-700">
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fee</p>
          <p>Action</p>
        </div>

        {/* Table Rows */}
        {[...appointments].reverse().map((item, index) => (
          <div
            key={index}
            className="grid sm:grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-2 items-center py-3 px-6 border-b hover:bg-gray-50"
          >
            <p className="hidden sm:block">{index + 1}</p>

            {/* Patient */}
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 rounded-full"
                src={item.userData?.image || assets.default_user}
                alt={item.userData?.name || "Unknown"}
              />
              <p>{item.userData?.name || "Unknown"}</p>
            </div>

            {/* Payment */}
            <p>
              <span className="text-xs inline border border-primary px-2 rounded-full">
                {item.payment ? "ONLINE" : "CASH"}
              </span>
            </p>

            {/* Age */}
            <p className="hidden sm:block">
              {calculateAge(item.userData?.dob)}
            </p>

            {/* Date & Time */}

            <p>
              {(() => {
                let dateStringForFormat = item.slotDate || "";

                if (!dateStringForFormat && item.slotData) {
                  if (item.slotData.includes("_")) {

                    dateStringForFormat = item.slotData
                      .split("_")
                      .slice(0, 3)
                      .join("/");
                  } else {

                    dateStringForFormat = item.slotData;
                  }
                }

                return dateStringForFormat
                  ? slotDateFormat(dateStringForFormat)
                  : "N/A";
              })()}
              , {item.slotTime || "N/A"}
            </p>

            {/* Fee */}
            <p>
              {currency}
              {item.amount}
            </p>

            {/* Action */}
            <div className="flex gap-2">
              {item.cancelled ? (
                <p className="text-red-400 text-xs font-medium">Cancelled</p>
              ) : item.isCompleted ? (
                <p className="text-green-500 text-xs font-medium">Completed</p>
              ) : (
                <>
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className="w-8 h-8 cursor-pointer"
                    src={assets.cancel_icon}
                    alt="Cancel"
                  />
                  <img
                    onClick={() => completeAppointment(item._id)}
                    className="w-8 h-8 cursor-pointer"
                    src={assets.tick_icon}
                    alt="Complete"
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorAppointment;
