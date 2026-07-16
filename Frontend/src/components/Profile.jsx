import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiLogOut,
  FiEdit2,
  FiCamera,
  FiUser,
  FiShield,
  FiLock,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiMail,
  FiPhone,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";

const Profile = ({ user, setUser, setActiveView, onLogout }) => {
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem("profile_data");
    return savedData
      ? JSON.parse(savedData)
      : {
          name: "",
          email: "",
          phone: "",
          avatar: null,
        };
  });

  const [passwords, setPasswords] = useState({
    oldPass: "",
    newPass: "",
    confirmPass: "",
  });

  // ✅ Fetch real profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5001/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const saved = localStorage.getItem("profile_data");
          const local = saved ? JSON.parse(saved) : {};
          const merged = {
            name: data.name || local.name || "",
            email: data.email || local.email || "",
            phone: local.phone || "",
            avatar: local.avatar || null,
          };
          setFormData(merged);
          localStorage.setItem("profile_data", JSON.stringify(merged));
          localStorage.setItem("userName", data.name || "");
          window.dispatchEvent(new Event("userUpdate"));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePassChange = (e) =>
    setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleSave = () => {
    localStorage.setItem("profile_data", JSON.stringify(formData));
    localStorage.setItem("userName", formData.name || "");
    setUser?.({ ...user, ...formData });
    window.dispatchEvent(new Event("userUpdate"));
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = { ...formData, avatar: reader.result };
      setFormData(updated);
      localStorage.setItem("profile_data", JSON.stringify(updated));
      window.dispatchEvent(new Event("userUpdate"));
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarDelete = () => {
    const updated = { ...formData, avatar: null };
    setFormData(updated);
    localStorage.setItem("profile_data", JSON.stringify(updated));
    window.dispatchEvent(new Event("userUpdate"));
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("profile_data");
    window.location.href = "/login";
  };

  const inputClass = `
    w-full py-2.5 md:py-3 px-3 rounded-xl text-sm font-medium
    outline-none transition-all duration-200 ease-out
    ${
      isDark
        ? "bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500/70 focus:bg-cyan-500/5"
        : "bg-white/40 border border-cyan-200/70 text-slate-800 placeholder-slate-400 focus:border-cyan-400 focus:bg-white/60"
    }
    disabled:opacity-40 disabled:cursor-not-allowed
  `;

  const labelClass = `block text-[10px] font-black uppercase tracking-[0.18em] mb-2
    ${isDark ? "text-slate-500" : "text-slate-400"}
  `;

  const gradientText = `bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-700 
    bg-clip-text text-transparent
    dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] 
    dark:bg-clip-text dark:text-transparent 
    dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]`;

  const tabs = [
    { id: "info", label: "General Information", icon: FiUser },
    { id: "security", label: "Security & Privacy", icon: FiShield },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)"
          : "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
      }}
    >
      {/* Background blobs (সায়ান-ব্লু থিমে রি-ম্যাপ করা) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-0 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-0 dark:opacity-10"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-0 dark:opacity-10"
          style={{
            background: "radial-gradient(circle, #3b82f6, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 w-full">
        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between mb-8 md:mb-14">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`group flex items-center gap-2 text-sm font-semibold transition-all duration-200 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-cyan-700"}`}
          >
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${isDark ? "bg-white/5 border border-white/10 group-hover:bg-cyan-500/15 group-hover:border-cyan-500/30" : "bg-white/60 border border-cyan-200/60 shadow-sm group-hover:border-cyan-300 group-hover:bg-cyan-100/60"}`}
            >
              <FiArrowLeft
                size={14}
                className="group-hover:-translate-x-0.5 transition-transform duration-200"
              />
            </span>
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={handleSignOut}
            className={`group flex items-center gap-2 text-sm font-semibold transition-all duration-200 ${isDark ? "text-red-400 hover:text-white" : "text-red-500 hover:text-red-700"}`}
          >
            <span className="hidden sm:inline">Sign Out</span>
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${isDark ? "bg-red-500/10 border border-red-500/20 group-hover:bg-red-500 group-hover:border-red-500" : "bg-red-50/80 border border-red-200/80 shadow-sm group-hover:bg-red-500 group-hover:border-red-500"}`}
            >
              <FiLogOut
                size={14}
                className={`transition-all duration-200 group-hover:translate-x-0.5 ${isDark ? "" : "group-hover:text-white"}`}
              />
            </span>
          </button>
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* ── LEFT PANEL ── */}
          <div className="lg:w-64 shrink-0">
            {/* Avatar section */}
            <div className="flex flex-col items-center mb-6 md:mb-8 w-full">
              <div className="relative mb-4 md:mb-5">
                <div
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl overflow-hidden bg-linear-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 ring-4 ${isDark ? "ring-white/5" : "ring-white/80"}`}
                >
                  {formData?.avatar ? (
                    <img
                      src={formData.avatar}
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                  ) : (
                    <span className="text-3xl md:text-4xl font-black text-white">
                      {formData.name ? (
                        formData.name.charAt(0).toUpperCase()
                      ) : (
                        <FiUser />
                      )}
                    </span>
                  )}
                </div>

                {/* Upload */}
                <label
                  className={`absolute -bottom-2 -right-2 w-8 h-8 md:w-9 md:h-9 rounded-2xl bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center shadow-lg transition-all duration-200 border-2 cursor-pointer ${isDark ? "border-[#0d1117]" : "border-white"}`}
                  title="Upload photo"
                >
                  <FiCamera size={13} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>

                {/* Delete avatar */}
                {formData?.avatar && (
                  <button
                    onClick={handleAvatarDelete}
                    title="Remove photo"
                    className={`absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200 border-2 cursor-pointer ${isDark ? "border-[#0d1117]" : "border-white"}`}
                  >
                    <FiTrash2 size={11} className="text-white" />
                  </button>
                )}
              </div>

              <h2 className="text-lg md:text-xl text-center font-bold tracking-wide mb-1 w-full">
                <span className={gradientText}>
                  {formData.name || "User Profile"}
                </span>
              </h2>
              <p className="text-xs md:text-sm text-center mb-4 tracking-wide w-full">
                <span className={gradientText}>
                  {formData.email || "No email assigned"}
                </span>
              </p>

              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-linear-to-r from-emerald-500 via-emerald-600 to-teal-700 bg-clip-text text-transparent" : "bg-green-100/80 border border-green-200 text-green-700"}`}
              >
                Verified
              </span>
            </div>

            <div
              className={`h-px w-full mb-4 md:mb-6 ${isDark ? "bg-white/5" : "bg-cyan-200/50"}`}
            />

            {/* Tabs ── horizontal on mobile, vertical on desktop */}
            <nav className="flex flex-row lg:flex-col gap-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl text-xs md:text-sm font-semibold text-left transition-all duration-200 flex-1 lg:flex-none
                    ${
                      activeTab === id
                        ? isDark
                          ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-300"
                          : "bg-cyan-100/80 border border-cyan-300/50 text-cyan-700"
                        : isDark
                          ? "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                          : "text-slate-400 hover:text-slate-700 hover:bg-cyan-100/40"
                    }`}
                >
                  <span
                    className={`w-1 h-4 rounded-full transition-all duration-200 hidden lg:block ${activeTab === id ? "bg-cyan-500" : "bg-transparent"}`}
                  />
                  <Icon size={14} />
                  <span className="hidden sm:inline truncate">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="flex-1 min-w-0 bg-transparent">
            <AnimatePresence mode="wait">
              {activeTab === "info" && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-10">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">
                        <span className={gradientText}>Account Details</span>
                      </h3>
                      <p
                        className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        Update your public identity and core information.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center gap-2 px-4 py-2.5 font-semibold text-sm tracking-wide text-white bg-linear-to-br from-cyan-600 via-blue-500 to-blue-700 border border-white/20 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
                    >
                      {isEditing ? (
                        <>
                          <FiX size={12} />
                          <span>Cancel</span>
                        </>
                      ) : (
                        <>
                          <FiEdit2 size={12} />
                          <span>Edit Profile</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className={labelClass}>
                        <span className={gradientText}>Full Name</span>
                      </label>
                      <div className="relative">
                        <FiUser
                          size={13}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20" : "text-slate-400"}`}
                        />
                        <input
                          type="text"
                          name="name"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <span className={gradientText}>Email Address</span>
                      </label>
                      <div className="relative">
                        <FiMail
                          size={13}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20" : "text-slate-400"}`}
                        />
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        <span className={gradientText}>Contact Number</span>
                      </label>
                      <div className="relative">
                        <FiPhone
                          size={13}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20" : "text-slate-400"}`}
                        />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Enter your number"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mt-6 md:mt-8"
                    >
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-xl font-bold text-sm text-white bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700 border border-white/20 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] transition-all duration-300 hover:shadow-[0_12px_25px_-4px_rgba(16,185,129,0.6)] hover:brightness-110 hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <FiSave size={13} /> Save Changes
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6 md:mb-10">
                    <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">
                      <span className={gradientText}>
                        Privacy & Credentials
                      </span>
                    </h3>
                    <p
                      className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Manage your authentication settings.
                    </p>
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label className={labelClass}>
                        <span className={gradientText}>Current Password</span>
                      </label>
                      <div className="relative">
                        <FiLock
                          size={13}
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20" : "text-slate-400"}`}
                        />
                        <input
                          type={showOld ? "text" : "password"}
                          placeholder="Enter your password"
                          name="oldPass"
                          onChange={handlePassChange}
                          className={`${inputClass} pl-10 pr-11`}
                        />
                        <button
                          onClick={() => setShowOld(!showOld)}
                          className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20 hover:text-cyan-400" : "text-slate-400 hover:text-cyan-600"}`}
                        >
                          {showOld ? (
                            <FiEyeOff size={14} />
                          ) : (
                            <FiEye size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      {[
                        {
                          label: "New Password",
                          name: "newPass",
                          show: showNew,
                          setShow: setShowNew,
                        },
                        {
                          label: "Confirm Password",
                          name: "confirmPass",
                          show: showConfirm,
                          setShow: setShowConfirm,
                        },
                      ].map(({ label, name, show, setShow }) => (
                        <div key={name}>
                          <label className={labelClass}>
                            <span className={gradientText}>{label}</span>
                          </label>
                          <div className="relative">
                            <FiLock
                              size={13}
                              className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20" : "text-slate-400"}`}
                            />
                            <input
                              type={show ? "text" : "password"}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              name={name}
                              onChange={handlePassChange}
                              className={`${inputClass} pl-10 pr-11`}
                            />
                            <button
                              onClick={() => setShow(!show)}
                              className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/20 hover:text-cyan-400" : "text-slate-400 hover:text-cyan-600"}`}
                            >
                              {show ? (
                                <FiEyeOff size={14} />
                              ) : (
                                <FiEye size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="mt-6 md:mt-8 flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 font-semibold text-sm text-white bg-linear-to-br from-cyan-600 via-blue-500 to-blue-700 border border-white/20 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 cursor-pointer w-full sm:w-auto justify-center">
                    <FiLock size={16} /> <span>Update Password</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 md:px-6 py-3 md:py-3.5 rounded-2xl bg-linear-to-r from-green-500 to-emerald-600 text-white text-sm font-bold shadow-2xl border border-white/20 whitespace-nowrap"
          >
            <FiCheck size={16} /> Profile updated successfully
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
