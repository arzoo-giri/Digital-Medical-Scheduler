import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";

const formatTime = (time24h) => {
    if (!time24h) return "N/A";
    const [hours, minutes] = time24h.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const DoctorSchedule = () => {
    const { profileData, getProfileData, getSlotsByDate, addSlot, removeSlot } =
        useContext(DoctorContext);
    const { currency } = useContext(AppContext);

    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSlot, setNewSlot] = useState({
        startTime: "09:00",
        endTime: "17:00",
        fee: 50,
    });

    useEffect(() => {
        const loadProfileAndSlots = async () => {
            try {
                const profile = await getProfileData(); 
                if (!profile?._id) {
                    toast.error("Doctor profile not loaded");
                    return;
                }

                if (profile.fees) {
                    setNewSlot((prev) => ({ ...prev, fee: profile.fees }));
                }

                fetchSlots(profile);
            } catch (err) {
                toast.error("Doctor profile not loaded");
            }
        };
        loadProfileAndSlots();
    }, []);

    const fetchSlots = async (profile) => {
        setLoading(true);
        try {
            const slots = await getSlotsByDate(selectedDate);
            const slotsArray = Object.entries(slots || {}).map(
                ([timeRange, data]) => {
                    const [startTime, endTime] = timeRange.split("-");
                    return { startTime, endTime, fee: data.fee, booked: data.booked };
                }
            );
            setAvailableSlots(slotsArray);
        } catch {
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = async (e) => {
        setSelectedDate(e.target.value);
        if (!profileData?._id) return; 
        fetchSlots(profileData);
    };

    const handleInputChange = (e) =>
        setNewSlot((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAddSlot = async () => {
        if (
            !newSlot.startTime ||
            !newSlot.endTime ||
            Number(newSlot.fee) <= 0
        ) {
            toast.error("Please fill all slot details correctly.");
            return;
        }
        if (newSlot.startTime >= newSlot.endTime) {
            toast.error("Start time must be before end time.");
            return;
        }
        
        try {
             await addSlot(
                 selectedDate,
                 newSlot.startTime,
                 newSlot.endTime,
                 Number(newSlot.fee)
             );
             
             fetchSlots(profileData);
        } catch (error) {
            console.error("Failed to add slot:", error);
        }

    };

    const handleRemoveSlot = async (index) => {
        if (!window.confirm("Are you sure you want to remove this slot?")) return;
        try {
            await removeSlot(selectedDate, index);
            fetchSlots(profileData);
        } catch (error) {
            console.error("Failed to remove slot:", error);
        }
    };

    if (profileData === null)
        return <p className="text-gray-500">Loading profile...</p>;
    
    if (!profileData?._id) 
        return <p className="text-red-500">Error: Doctor profile failed to load.</p>;


    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
                Manage Schedule
            </h1>

            {/* Date Selection */}
            <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <label
                    htmlFor="schedule-date"
                    className="block text-lg font-medium text-gray-700 mb-2"
                >
                    Select Date for Scheduling:
                </label>
                <input
                    type="date"
                    id="schedule-date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full sm:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150"
                />
            </div>

            {/* Add Slot */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <img src={assets.tick_icon} alt="Add Slot" className="w-5 h-5" />
                    Add New Slot for {new Date(selectedDate).toLocaleDateString()}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label
                            htmlFor="startTime"
                            className="block text-sm font-medium text-gray-600 mb-1"
                        >
                            Start Time
                        </label>
                        <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={newSlot.startTime}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="endTime"
                            className="block text-sm font-medium text-gray-600 mb-1"
                        >
                            End Time
                        </label>
                        <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={newSlot.endTime}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="fee"
                            className="block text-sm font-medium text-gray-600 mb-1"
                        >
                            Fee ({currency})
                        </label>
                        <input
                            type="number"
                            id="fee"
                            name="fee"
                            value={newSlot.fee}
                            onChange={handleInputChange}
                            min="0"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <button
                        onClick={handleAddSlot}
                        className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition duration-150 shadow-md hover:shadow-lg"
                    >
                        Add Slot
                    </button>
                </div>
            </div>

            {/* Existing Slots */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <img
                        src={assets.list_icon}
                        alt="Existing Slots"
                        className="w-5 h-5"
                    />
                    Existing Slots ({availableSlots.length})
                </h2>
                {loading ? (
                    <p className="text-gray-500">Loading slots...</p>
                ) : availableSlots.length > 0 ? (
                    <div className="space-y-3">
                        {availableSlots.map((slot, index) => (
                            <div
                                key={index}
                                className={`flex justify-between items-center p-3 rounded-lg border ${
                                    slot.booked
                                        ? "bg-red-50 border-red-200"
                                        : "bg-gray-50 border-gray-200"
                                }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-medium text-gray-900">
                                        {formatTime(slot.startTime)} -{" "}
                                        {formatTime(slot.endTime)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Fee:{" "}
                                        <span className="font-semibold">
                                            {currency}
                                            {slot.fee}
                                        </span>
                                    </p>
                                    {slot.booked && (
                                        <p className="text-sm text-red-600 font-medium mt-1">
                                            Slot booked
                                        </p>
                                    )}
                                </div>
                                {!slot.booked && (
                                    <button
                                        onClick={() => handleRemoveSlot(index)}
                                        className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-full hover:bg-red-50 transition duration-150"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">
                        No slots defined for this day. Use the form above to add one.
                    </p>
                )}
            </div>
        </div>
    );
};

export default DoctorSchedule;