import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import axios from "axios";
import { toast } from "react-toastify";

const SYMPTOM_OPTIONS = [
  "fever",
  "headache",
  "chest_pain",
  "difficulty_breathing",
  "sore_throat",
  "stomach_pain",
  "skin_rash",
  "pregnancy_symptoms",
  "child_fever",
];

const formatTimeDisplay = (time24h) => {
  const [hours, minutes] = time24h.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateDisplay = (dateKey, daysOfWeek) => {
  const date = new Date(dateKey + "T00:00:00");
  const dayName = daysOfWeek[date.getDay()];
  const dateNum = date.getDate();
  const monthName = date.toLocaleString("default", { month: "short" });
  return { dayName, dateNum, monthName };
};

const getPriorityColor = (level) => {
  switch (level) {
    case "High":
      return "text-red-600 font-extrabold";
    case "Medium":
      return "text-orange-500 font-bold";
    default:
      return "text-green-600 font-semibold";
  }
};

const Appointment = () => {
  const { docId } = useParams();
  const navigate = useNavigate();

  const {
    doctors,
    currencySymbol,
    backendUrl,
    token,
    getDoctorsData,
    classifyUserSymptoms,
  } = useContext(AppContext);

  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // STATE
  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState({});
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [symptoms, setSymptoms] = useState([]);
  const [classificationResult, setClassificationResult] = useState(null);
  const [loadingClassification, setLoadingClassification] = useState(false);

  // Fetch doctor info from context
  useEffect(() => {
    const doc = doctors.find((d) => d._id === docId) || null;
    setDocInfo(doc);
  }, [doctors, docId]);

  // Fetch slots for 3 days
  const fetchSlotsForDays = useCallback(async () => {
    if (!docId || !token) return;

    setLoadingSlots(true);

    try {
      const slotsObj = {};

      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const formattedDate = date.toISOString().split("T")[0];

        const { data } = await axios.post(
          `${backendUrl}/api/doctor/schedule/get-slots`,
          { date: formattedDate, docId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        slotsObj[formattedDate] = data.success
          ? data.slots.map((s) => s.startTime)
          : [];
      }

      setDocSlots(slotsObj);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch doctor schedule.");
    } finally {
      setLoadingSlots(false);
    }
  }, [docId, token, backendUrl]);

  useEffect(() => {
    if (docInfo) fetchSlotsForDays();
  }, [docInfo, fetchSlotsForDays]);

  const getSortedDateKeys = () => Object.keys(docSlots).sort();
  const getSelectedDate = (index) => getSortedDateKeys()[index];

  const handleSymptomChange = (symptom) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
    setClassificationResult(null);
  };

  // ---- CLASSIFICATION ----
  const handleGetSuggestion = async () => {
    if (symptoms.length === 0) {
      toast.info("Select at least one symptom to get a suggestion.");
      return;
    }

    setLoadingClassification(true);

    const result = await classifyUserSymptoms(symptoms);
    setClassificationResult(result);

    setLoadingClassification(false);

    if (result) toast.success(`Suggested Specialty: ${result.specialty}`);
  };

  // ---- BOOK APPOINTMENT ----
  const bookAppointment = useCallback(async () => {
    if (!token) {
      toast.warn("Login to book appointment");
      return navigate("/login");
    }

    if (bookingLoading) return;

    if (symptoms.length === 0) {
      toast.warn("Please select at least one symptom");
      return;
    }

    const selectedDateKey = getSelectedDate(slotIndex);

    if (!selectedDateKey || !slotTime) {
      toast.warn("Select a date and time slot first");
      return;
    }

    setBookingLoading(true);

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        {
          doctorId: docId,
          slotDate: selectedDateKey,
          slotTime,
          symptoms,
          amount: docInfo.fees,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);

        getDoctorsData();
        await fetchSlotsForDays();

        setSlotTime("");
        setSymptoms([]);
        setClassificationResult(null);

        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error booking appointment");
    } finally {
      setBookingLoading(false);
    }
  }, [
    token,
    bookingLoading,
    symptoms,
    slotIndex,
    slotTime,
    docId,
    docInfo,
    backendUrl,
    navigate,
    getDoctorsData,
    fetchSlotsForDays,
  ]);

  if (!docInfo) return <p>Loading doctor info...</p>;

  const sortedDateKeys = getSortedDateKeys();
  const currentDaySlots = docSlots[sortedDateKeys[slotIndex]] || [];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">

      {/* DOCTOR INFO */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <img
          className="bg-primary w-full sm:max-w-72 rounded-lg"
          src={docInfo.image}
          alt={docInfo.name}
        />

        <div className="flex-1 border border-gray-200 shadow-md rounded-lg p-8 bg-white">
          <p className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
            {docInfo.name}
            <img className="w-5" src={assets.verified_icon} alt="" />
          </p>

          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <span className="px-2 py-0.5 bg-gray-100 border text-xs rounded-full">
              {docInfo.experience}
            </span>
          </div>

          <p className="text-gray-500 font-medium mt-4">
            Appointment fee:{" "}
            <span className="text-gray-700 font-bold">
              {currencySymbol}{docInfo.fees}
            </span>
          </p>
        </div>
      </div>

      {/* SYMPTOM SELECTOR */}
      <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 my-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          1. Describe Your Symptoms
        </h2>

        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((symptom) => (
            <button
              key={symptom}
              onClick={() => handleSymptomChange(symptom)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition ${
                symptoms.includes(symptom)
                  ? "bg-red-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {symptom.replace(/_/g, " ").toUpperCase()}
            </button>
          ))}
        </div>

        {/* CLASSIFICATION BUTTON */}
        <button
          onClick={handleGetSuggestion}
          disabled={symptoms.length === 0 || loadingClassification}
          className="mt-6 py-2.5 px-6 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
        >
          {loadingClassification ? "Analyzing..." : "Get Priority & Suggestion"}
        </button>

        {/* CLASSIFICATION RESULT */}
        {classificationResult && (
          <div className="mt-4 p-3 border rounded-lg bg-yellow-50 border-yellow-200">
            <p className="font-bold text-sm text-yellow-800">Symptom Analysis:</p>

            <p className="text-sm">
              Suggested Specialty:
              <span className="font-semibold text-indigo-700 ml-1">
                {classificationResult.specialty}
              </span>
            </p>

            <p className="text-sm mt-1">
              Calculated Urgency:
              <span
                className={`ml-1 ${getPriorityColor(
                  classificationResult.priorityLevel
                )}`}
              >
                {classificationResult.priorityLevel}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                (Score: {classificationResult.priorityScore})
              </span>
            </p>
          </div>
        )}
      </div>

      {/* SLOT SELECTION */}
      <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          2. Select Booking Slot
        </h2>

        {loadingSlots ? (
          <p className="text-gray-500">Loading schedules...</p>
        ) : sortedDateKeys.length === 0 ? (
          <p className="text-red-500 font-medium">No available slots</p>
        ) : (
          <>
            {/* Dates */}
            <div className="flex gap-3 overflow-x-scroll pb-4">
              {sortedDateKeys.map((dateKey, index) => {
                const { dayName, dateNum, monthName } = formatDateDisplay(
                  dateKey,
                  daysOfWeek
                );

                return (
                  <div
                    key={dateKey}
                    onClick={() => {
                      setSlotIndex(index);
                      setSlotTime("");
                    }}
                    className={`text-center py-2 px-3 min-w-24 rounded-lg cursor-pointer transition ${
                      slotIndex === index
                        ? "bg-primary text-white shadow-lg border-primary border-2"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-sm">{dayName}</p>
                    <p className="text-lg font-bold">{dateNum}</p>
                    <p className="text-xs">{monthName}</p>
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="flex gap-3 overflow-x-scroll pb-4 mt-3">
              {currentDaySlots.length === 0 ? (
                <p className="text-gray-500 text-sm">No slots available today</p>
              ) : (
                currentDaySlots.map((time, i) => (
                  <p
                    key={i}
                    onClick={() => setSlotTime(time)}
                    className={`text-sm px-5 py-2 rounded-full cursor-pointer transition ${
                      time === slotTime
                        ? "bg-green-600 text-white shadow-md border-2 border-green-700"
                        : "text-gray-600 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {formatTimeDisplay(time)}
                  </p>
                ))
              )}
            </div>
          </>
        )}

        {/* BOOK BUTTON */}
        <button
          onClick={bookAppointment}
          disabled={symptoms.length === 0 || !slotTime || loadingSlots || bookingLoading}
          className={`text-white text-base font-semibold px-14 py-3 rounded-full my-6 transition ${
            symptoms.length === 0 || !slotTime || loadingSlots || bookingLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-red-700 shadow-lg"
          }`}
        >
          {bookingLoading ? "Booking..." : "Book an appointment"}
        </button>
      </div>

      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  );
};

export default Appointment;
