import React, { useEffect, useState } from "react";
import {
  FiHome,
  FiFileText,
  FiClock,
  FiCalendar,
  FiActivity,
  FiUser,
} from "react-icons/fi";

const lightBg = { backgroundColor: "#f1f5f9" };
const darkBg = { backgroundColor: "#0d1117" };

export default function Sidebar({ activeView, setActiveView }) {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [localUser, setLocalUser] = useState({
    name: "",
    email: "",
    avatar: null,
  });

  const loadData = () => {
    const saved = localStorage.getItem("profile_data");
    if (saved) {
      setLocalUser(JSON.parse(saved));
    } else {
      const name = localStorage.getItem("userName") || "";
      setLocalUser({ name, email: "", avatar: null });
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("userUpdate", loadData);
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      observer.disconnect();
      window.removeEventListener("userUpdate", loadData);
    };
  }, []);

  const menuItems = [
    { name: "dashboard", label: "Dashboard", icon: <FiHome /> },
    { name: "patient-dashboard", label: "Patient Form", icon: <FiActivity /> },
    { name: "reports", label: "Reports", icon: <FiFileText /> },
    { name: "appointments", label: "Appointments", icon: <FiCalendar /> },
    { name: "history", label: "History", icon: <FiClock /> },
  ];

  return (
    <div
      className="w-64 h-full border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between transition-all duration-300 overflow-y-auto"
      style={isDark ? darkBg : lightBg}
    >
      {/* LOGO */}
      <div>
        <div className="flex items-center gap-2 mb-8 mt-3 ml-2">
          <h1 className="text-xl font-black tracking-tighter">
            <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent ml-4">
              MediScan
            </span>
            <span className="ml-2 bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]">
              AI
            </span>
          </h1>
        </div>

        {/* MENU ITEMS */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = activeView === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveView(item.name)}
                className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all duration-500 cursor-pointer group relative overflow-hidden
                  ${
                    isActive
                      ? "bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-800 text-white shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)]"
                      : "hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                  }`}
              >
                <span
                  className={`relative z-10 transition-colors duration-300 shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400"
                  }`}
                >
                  {React.cloneElement(item.icon, {
                    size: 18,
                    strokeWidth: isActive ? 2.5 : 1.5,
                  })}
                </span>
                <span
                  className={`relative z-10 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 ease-out ${isActive ? "text-white" : "text-cyan-500 dark:text-slate-300 group-hover:opacity-80"}`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4 -mx-2 px-2">
        <button
          onClick={() => setActiveView("profile")}
          className={`flex items-center gap-4 w-full px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer group relative overflow-hidden
            ${
              activeView === "profile"
                ? "bg-linear-to-br from-cyan-600/20 via-cyan-500/10 to-transparent border border-cyan-500/20 shadow-[0_10px_20px_-5px_rgba(6,182,212,0.2)] text-cyan-600 dark:text-cyan-400"
                : "hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 text-slate-500 dark:text-slate-400"
            }`}
        >
          {/* AVATAR */}
          <div className="relative z-10 shrink-0">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300
              ${activeView === "profile" ? "border-cyan-500" : "border-slate-300 dark:border-slate-700"}
              ${localUser?.avatar ? "" : "bg-cyan-200 dark:bg-slate-800"}`}
            >
              {localUser?.avatar ? (
                <img
                  src={localUser.avatar}
                  alt="User"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-cyan-500">
                  {localUser?.name ? (
                    localUser.name.charAt(0).toUpperCase()
                  ) : (
                    <FiUser />
                  )}
                </span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-[#0d1117] bg-green-500" />
          </div>

          {/* NAME + EMAIL */}
          <div className="flex-1 text-left relative z-10 min-w-0">
            <p className="font-semibold text-sm truncate bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
              {localUser?.name || "User Profile"}
            </p>
            <p className="text-xs text-cyan-500 dark:text-slate-400 truncate">
              {localUser?.email || "No email assigned"}
            </p>
          </div>

          {activeView === "profile" && (
            <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-50 rounded-xl" />
          )}
        </button>
      </div>
    </div>
  );
}
