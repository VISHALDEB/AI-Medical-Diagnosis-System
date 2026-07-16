import { useState } from "react";
import { FiX } from "react-icons/fi";
import { Stethoscope } from "lucide-react";

export default function AppointmentModal({ isOpen, onClose }) {
  const [hospital, setHospital] = useState("");
  const [doctor, setDoctor] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const hospitals = [
    "Apollo Hospital",
    "Medica Super Speciality Hospital",
    "Fortis Hospital",
    "AMRI Hospitals",
    "RG Kar Medical College",
    "Peerless Hospital",
  ];

  const doctorList = [
    {
      name: "Dr. Arjun Sharma",
      role: "Pulmonologist",
      slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"],
    },
    {
      name: "Dr. Priya Sen",
      role: "Thoracic Surgeon",
      slots: ["10:00 AM", "12:00 PM", "3:00 PM"],
    },
    {
      name: "Dr. Imran Khan",
      role: "Respiratory Medicine Specialist",
      slots: ["9:30 AM", "11:30 AM", "1:30 PM", "3:30 PM"],
    },
    {
      name: "Dr. Meera Nair",
      role: "Interventional Pulmonologist",
      slots: ["10:00 AM", "1:00 PM", "4:00 PM"],
    },
    {
      name: "Dr. Rohan Dasgupta",
      role: "Critical Care & Lung Specialist",
      slots: ["9:00 AM", "12:00 PM", "3:00 PM"],
    },
    {
      name: "Dr. Sunita Verma",
      role: "Pediatric Pulmonologist",
      slots: ["10:30 AM", "12:30 PM", "2:30 PM"],
    },
    {
      name: "Dr. Anil Bose",
      role: "Sleep & Lung Disorder Specialist",
      slots: ["11:00 AM", "2:00 PM", "5:00 PM"],
    },
    {
      name: "Dr. Kavita Patel",
      role: "Lung Oncologist",
      slots: ["9:00 AM", "11:00 AM", "3:00 PM"],
    },
    {
      name: "Dr. Sanjay Ghosh",
      role: "COPD & Asthma Specialist",
      slots: ["10:00 AM", "1:00 PM", "4:30 PM"],
    },
    {
      name: "Dr. Fatima Rahman",
      role: "Bronchoscopist & Pulmonologist",
      slots: ["9:30 AM", "12:00 PM", "2:30 PM", "5:00 PM"],
    },
  ];

  const doctorMap = Object.fromEntries(doctorList.map((d) => [d.name, d]));
  const selectedDoc = doctorMap[doctor];
  const availSlots = selectedDoc?.slots || [];

  const appointmentTypes = [
    "Consultation",
    "Follow-up",
    "Lung Function Test",
    "Bronchoscopy",
    "Chest X-Ray Review",
    "CT Scan Review",
    "Pulmonary Rehabilitation",
    "Emergency",
  ];

  const handleBook = async () => {
    setError("");
    if (!name || !hospital || !doctor || !type || !date || !time) {
      setError("Please fill all fields before booking.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please log in again.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, date, doctor, time, hospital, type }),
      });
      const data = await res.json();
      if (res.status === 401) {
        if (data.message === "Token expired") {
          localStorage.removeItem("token");
          localStorage.removeItem("userName");
          localStorage.removeItem("profile_data");
          setLoading(false);
          setError("Your session expired. Please log in again.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2500);
        } else {
          setLoading(false);
          setError(
            data.message ||
              "Authentication failed. Please try logging out and back in.",
          );
        }
        return;
      }
      if (res.status === 409) {
        setLoading(false);
        setError(data.message || "This slot is already booked.");
        return;
      }
      if (!res.ok) {
        setLoading(false);
        setError(data.message || "Failed to book appointment.");
        return;
      }
      setName("");
      setHospital("");
      setDoctor("");
      setType("");
      setDate("");
      setTime("");
      setError("");
      setLoading(false);
      onClose("success");
    } catch (err) {
      console.error("Booking error:", err);
      setLoading(false);
      setError(
        "Could not connect to server. Make sure Flask is running on port 5001.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-3 md:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#0F1A2A] text-black dark:text-white rounded-2xl p-4 md:p-6 shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold tracking-tight">
            Book New Appointment
          </h2>
          <button
            onClick={() => onClose()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
          >
            <FiX size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 md:space-y-4">
          {/* Patient Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">
              Patient Name
            </label>
            <input
              type="text"
              placeholder="Enter patient name"
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1B2B44] text-black dark:text-white outline-none border border-gray-300 dark:border-white/10 focus:border-cyan-500 transition placeholder-slate-400 dark:placeholder-slate-500 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Select Hospital */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">
              Select Hospital
            </label>
            <select
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1B2B44] text-black dark:text-white outline-none border border-gray-300 dark:border-white/10 focus:border-cyan-500 transition text-sm"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
            >
              <option value="">Choose a hospital</option>
              {hospitals.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Select Doctor */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">
              Select Doctor
            </label>
            <select
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1B2B44] text-black dark:text-white outline-none border border-gray-300 dark:border-white/10 focus:border-cyan-500 transition text-sm"
              value={doctor}
              onChange={(e) => {
                setDoctor(e.target.value);
                setTime("");
              }}
            >
              <option value="">Choose a doctor</option>
              {doctorList.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} — {d.role}
                </option>
              ))}
            </select>
            {selectedDoc && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Stethoscope
                  size={14}
                  className="text-cyan-500 dark:text-cyan-400 shrink-0"
                />
                <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-300">
                  Specialization:{" "}
                  <span className="font-black">{selectedDoc.role}</span>
                </p>
              </div>
            )}
          </div>

          {/* Appointment Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">
              Appointment Type
            </label>
            <select
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1B2B44] text-black dark:text-white outline-none border border-gray-300 dark:border-white/10 focus:border-cyan-500 transition text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Select type</option>
              {appointmentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">
              Select Date
            </label>
            <input
              type="date"
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-[#1B2B44] text-black dark:text-white outline-none border border-gray-300 dark:border-white/10 focus:border-cyan-500 transition text-sm"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
              Select Time
            </label>
            {doctor ? (
              <div className="grid grid-cols-3 gap-2">
                {availSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`p-2 md:p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 active:scale-95
                      ${
                        time === slot
                          ? "relative z-10 font-semibold text-sm tracking-wide cursor-pointer text-white bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 border border-white/20 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                          : "bg-gray-100 dark:bg-[#1B2B44] border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-cyan-400 hover:text-cyan-500"
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic px-1">
                Select a doctor first to see available slots
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full p-3 md:p-3.5 mt-2 relative z-10 px-10 py-3.5 font-semibold text-sm tracking-wide cursor-pointer text-white bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 border border-white/20 rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 ease-out hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />{" "}
                Booking...
              </>
            ) : (
              "Book Appointment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
