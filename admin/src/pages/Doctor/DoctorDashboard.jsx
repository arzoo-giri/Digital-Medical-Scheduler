import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";

const DoctorDashboard = () => {
  const {
    dashData,
    getDashData,
    cancelAppointment,
    completeAppointment,
    dToken,
    getSlotsByDate,
    addSlot,
    removeSlot,
  } = useContext(DoctorContext);

  const { currency, slotDateFormat } = useContext(AppContext);

  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ startTime: "", endTime: "", fee: "" });

  useEffect(() => {
    if (dToken) getDashData();
  }, [dToken]);

  if (!dashData) return <p>Loading...</p>;

  // Fetch slots for selected date
  const fetchSlots = async () => {
    if (!scheduleDate) return;
    const res = await getSlotsByDate(scheduleDate);
    if (res?.success) setSlots(res.slots);
  };

  const handleAddSlot = () => {
    const { startTime, endTime, fee } = newSlot;
    if (!scheduleDate || !startTime || !endTime || !fee) {
      toast.error("Please fill all fields correctly");
      return;
    }

    let formattedDate;
    if (scheduleDate instanceof Date) {
      formattedDate = scheduleDate.toISOString().split("T")[0];
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)) {
      formattedDate = scheduleDate;
    } else {
      toast.error("Invalid date format. Use YYYY-MM-DD.");
      return;
    }

    addSlot(formattedDate, startTime, endTime, fee);
    setNewSlot({ startTime: "", endTime: "", fee: "" });
  };

  const handleRemoveSlot = async (slotId) => {
    const res = await removeSlot({ slotId });
    if (res?.success) fetchSlots();
  };

  return (
    <div className="m-5">
      {/* Summary cards */}
      <div className="flex flex-wrap gap-3">
        {[{
          icon: assets.earning_icon,
          value: dashData.earnings || 0,
          label: "Earnings"
        }, {
          icon: assets.appointments_icon,
          value: dashData.appointments || 0,
          label: "Appointments"
        }, {
          icon: assets.patients_icon,
          value: dashData.patients || 0,
          label: "Patients"
        }].map((card, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all">
            <img className="w-14" src={card.icon} alt={card.label} />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {card.label === "Earnings" ? `${currency} ${card.value}` : card.value}
              </p>
              <p className="text-gray-400">{card.label}</p>
            </div>
          </div>
        ))}

        {/* Scheduler toggle card */}
        <div
          className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all"
          onClick={() => setShowScheduler(!showScheduler)}
        >
          <img className="w-14" src={assets.schedule_icon} alt="Schedule" />
          <div>
            <p className="text-xl font-semibold text-gray-600">Manage Schedule</p>
            <p className="text-gray-400 text-sm">Add / Remove Slots</p>
          </div>
        </div>
      </div>

      {/* Latest bookings */}
      <div className="bg-white mt-10">
        <div className="flex items-center gap-2.5 px-4 py-4 rounded-t">
          <img src={assets.list_icon} alt="Latest Bookings" />
          <p className="font-semibold">Latest Bookings</p>
        </div>

        <div className="pt-4 border border-t-0">
          {(dashData.latestAppointments || []).map((item, index) => {
            const userName = item.userData?.name || "Unknown";
            const userImage = item.userData?.image || assets.default_user;

            let dateString = item.slotDate || "";
            if (!dateString && item.slotData) {
              dateString = item.slotData.includes("_")
                ? item.slotData.split("_").slice(0, 3).join("/")
                : item.slotData;
            }
            if (!dateString) dateString = "-";

            return (
              <div key={index} className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100">
                <img className="rounded-full w-10" src={userImage} alt={userName} />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800 font-medium">{userName}</p>
                  <p className="text-gray-600">{slotDateFormat(dateString)}</p>
                </div>

                {item.cancelled ? (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                ) : item.isCompleted ? (
                  <p className="text-green-500 text-xs font-medium">Completed</p>
                ) : (
                  <div className="flex gap-2">
                    <img
                      onClick={() => cancelAppointment(item._id)}
                      className="w-10 cursor-pointer"
                      src={assets.cancel_icon}
                      alt="Cancel"
                    />
                    <img
                      onClick={() => completeAppointment(item._id)}
                      className="w-10 cursor-pointer"
                      src={assets.tick_icon}
                      alt="Complete"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Doctor Scheduler */}
      {showScheduler && (
        <div className="bg-white mt-10 p-4 rounded border">
          <p className="font-semibold mb-2">Manage Schedule</p>

          <div className="flex gap-2 mb-3">
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border p-1 rounded"
            />
            <button onClick={fetchSlots} className="bg-blue-500 text-white px-3 py-1 rounded">
              Load Slots
            </button>
          </div>

          {/* Existing slots */}
          <div className="mb-3">
            {slots.length === 0 ? (
              <p className="text-gray-500 text-sm">No slots for this date.</p>
            ) : (
              slots.map((slot, index) => (
                <div key={index} className="flex justify-between items-center p-1 border-b">
                  <span>
                    {slot.startTime} - {slot.endTime} | {currency} {slot.fee}
                  </span>
                  <button onClick={() => handleRemoveSlot(slot._id)} className="text-red-500 text-sm">
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add new slot */}
          <div className="flex gap-2">
            <input
              type="time"
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
              className="border p-1 rounded"
            />
            <input
              type="time"
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
              className="border p-1 rounded"
            />
            <input
              type="number"
              placeholder="Fee"
              value={newSlot.fee}
              onChange={(e) => setNewSlot({ ...newSlot, fee: e.target.value })}
              className="border p-1 rounded w-20"
            />
            <button onClick={handleAddSlot} className="bg-green-500 text-white px-3 py-1 rounded">
              Add Slot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
