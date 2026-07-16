import { useState, useEffect } from "react";
import {
  CalendarCheck,
  User,
  Clock,
  Plus,
  Trash2,
  Stethoscope,
  Building2,
} from "lucide-react";
import AppointmentModal from "./AppointmentModal";

export default function Appointments({ language = "en" }) {
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // সায়ান থিমের সাথে ম্যাচিং লাইট ও ডার্ক ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট
  const lightBg = {
    background:
      "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
  };
  const darkBg = {
    background:
      "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
  };

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

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

  const doctorMap = Object.fromEntries(
    doctorList.map((d) => [d.name, { role: d.role, slots: d.slots }]),
  );

  const t = {
    en: {
      title: "Appointments",
      noAppointments: "No upcoming appointments",
      book: "Book Appointment",
      cancel: "Cancel",
      role: "Specialization",
    },
    bn: {
      title: "অ্যাপয়েন্টমেন্ট",
      noAppointments: "কোনো অ্যাপয়েন্টমেন্ট নেই",
      book: "বুক করুন",
      cancel: "বাতিল",
      role: "विशेषज्ञता",
    },
    hi: {
      title: "अपॉइंटमेंट्स",
      noAppointments: "कोई अपॉइंटमेंट नहीं",
      book: "बुक करें",
      cancel: "रद्द करें",
      role: "विशेषज्ञता",
    },
  };

  const fetchAppointments = () => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5001/appointments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching appointments:", err));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const formatDate = (d) => {
    if (!d) return "";
    const locales = { hi: "hi-IN", bn: "bn-BD", en: "en-US" };
    try {
      return new Intl.DateTimeFormat(locales[language] || "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(d));
    } catch {
      return d;
    }
  };

  const cancelAppointment = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleModalClose = (result) => {
    setShowModal(false);
    if (result === "success") fetchAppointments();
  };

  return (
    <div
      className="p-4 md:p-8 min-h-screen transition-all duration-300 text-black dark:text-white"
      style={isDark ? darkBg : lightBg}
    >
      <AppointmentModal isOpen={showModal} onClose={handleModalClose} />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div className="flex items-center gap-2 md:gap-3">
          <CalendarCheck
            className="text-cyan-500 dark:text-cyan-400"
            size={28}
          />
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            <span className="bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
              {t[language].title}
            </span>
          </h1>
        </div>

        {/* বুক অ্যাপয়েন্টমেন্ট বাটন */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 font-semibold text-xs md:text-sm text-white cursor-pointer bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 border border-white/20 rounded-xl shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)] transition-all duration-300 ease-out hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_-4px_rgba(6,182,212,0.6)] active:scale-95 active:translate-y-0.5 active:shadow-[0_4px_10px_-2px_rgba(6,182,212,0.3)]"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t[language].book}</span>
          <span className="sm:hidden">Book</span>
        </button>
      </div>

      {/* EMPTY STATE */}
      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800">
          <CalendarCheck
            className="text-gray-300 dark:text-slate-700 mb-4"
            size={48}
          />
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg font-medium text-center px-4">
            {t[language].noAppointments}
          </p>
        </div>
      )}

      {/* APPOINTMENTS LIST */}
      <div className="grid gap-3 md:gap-4">
        {appointments.map((a) => {
          const docRole = doctorMap[a.doctor]?.role || "Lung Specialist";
          return (
            <div
              key={a.id}
              className="group p-4 md:p-5 bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center hover:border-cyan-500/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                {/* ইউজার আইকন সার্কেল */}
                <div className="p-2.5 md:p-3 bg-cyan-100 dark:bg-cyan-950/40 rounded-full text-cyan-600 dark:text-cyan-400 shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* পেশেন্টের নাম */}
                  <p className="font-bold text-base md:text-lg tracking-tight bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
                    {a.name}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-cyan-500" />
                      {formatDate(a.date)} | {a.time}
                    </span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold truncate">
                      {a.doctor}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Stethoscope size={11} className="text-cyan-400" />
                    <span className="text-xs text-cyan-500 dark:text-cyan-400 font-medium">
                      {docRole}
                    </span>
                  </div>
                  {(a.hospital || a.type) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {a.hospital && (
                        <div className="flex items-center gap-1">
                          <Building2 size={11} className="text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {a.hospital}
                          </span>
                        </div>
                      )}
                      {a.type && (
                        /* অ্যাপয়েন্টমেন্ট টাইপ ব্যাজ */
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-300 font-medium">
                          {a.type}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 md:mt-0 flex items-center justify-end w-full md:w-auto">
                <button
                  onClick={() => cancelAppointment(a.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <Trash2
                    size={18}
                    className="group-hover:scale-110 transition-transform"
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
