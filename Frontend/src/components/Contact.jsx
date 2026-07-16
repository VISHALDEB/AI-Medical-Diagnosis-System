import React, { useState } from "react";
import {
  BsEnvelopeFill,
  BsPhoneFill,
  BsGeoAltFill,
  BsSendFill,
  BsActivity,
  BsPersonFill,
  BsChatLeftTextFill,
} from "react-icons/bs";
import { useTheme } from "./useTheme";
import MedicalConstellation from "./MedicalConstellation";

const lightBg = {
  background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
};
const darkBg = {
  background:
    "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
};

export default function Contact() {
  const isDark = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("Processing pipeline transmission...");

    try {
      const response = await fetch("http://localhost:5001/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("Message securely transmitted to triage registry!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        // e.g. missing fields (400) or "saved but email failed" (207)
        setStatus(data.message || "Transmission failed. Please try again.");
      }
    } catch (err) {
      console.error("Contact submit error:", err);
      setStatus("Transmission failed. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-slate-50 dark:bg-black/40 border border-cyan-200/60 dark:border-cyan-500/20 rounded-xl py-3 px-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-hidden transition-all duration-300 font-medium focus:ring-1 focus:ring-cyan-500/40";
  const underline = (field, color = "bg-cyan-500") =>
    `absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] ${color} transition-all duration-500 rounded-full ${focusedField === field ? "w-11/12 opacity-100 shadow-[0_0_10px_#06b6d4]" : "w-0 opacity-0"}`;

  return (
    <div
      className="min-h-screen transition-colors duration-300 overflow-x-hidden relative flex items-center justify-center p-4 sm:p-6 md:p-10 pt-20 pb-12 md:pt-24 md:pb-16"
      style={isDark ? darkBg : lightBg}
    >
      <MedicalConstellation />

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-160 md:h-160 rounded-full opacity-0 dark:opacity-15 blur-3xl transition-all duration-700 ease-out"
          style={{
            background:
              focusedField === "message"
                ? "radial-gradient(circle, #06b6d4, transparent)"
                : "radial-gradient(circle, #0891b2, transparent)",
            transform: focusedField
              ? `translate(-50%, -50%) scale(1.1) translate(${focusedField === "name" ? "-8%" : "8%"}, 0px)`
              : "translate(-50%, -50%) scale(1)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center mt-6 md:mt-16">
        {/* LEFT PANEL */}
        <div className="md:col-span-4 flex flex-col gap-4 order-2 md:order-1">
          <div className="text-center md:text-left mb-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300/50 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />{" "}
              Gateway Operations
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-700 dark:text-slate-300 tracking-wide flex items-center gap-2 justify-center md:justify-start">
              <BsActivity className="text-cyan-400 animate-pulse" /> Operations
              Hub
            </h2>
          </div>

          {[
            {
              icon: BsEnvelopeFill,
              label: "Email System",
              value: "sayanbasu183@gmail.com",
            },
            {
              icon: BsPhoneFill,
              label: "Telemetry Support",
              value: "+91 xxxxx xxxxx",
            },
            {
              icon: BsGeoAltFill,
              label: "Central Node",
              value: "Kolkata, India",
            },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="relative group overflow-hidden rounded-2xl p-4 sm:p-5 bg-white/40 dark:bg-black/40 border border-cyan-200/40 dark:border-cyan-500/20 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-cyan-500/40"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm sm:text-base shadow-md shrink-0">
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {label}
                  </h4>
                  <p className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold break-all">
                    {value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT PANEL (FORM) */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="md:col-span-8 bg-white/80 dark:bg-[#020d1a]/90 backdrop-blur-xl border border-cyan-200/60 dark:border-cyan-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl flex flex-col gap-5 sm:gap-6 order-1 md:order-2"
        >
          <div className="text-center md:text-left relative">
            <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1">
              Contact Us
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
              <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]">
                Send a Message
              </span>
            </h1>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5 relative z-10">
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <BsPersonFill className="text-cyan-500 dark:text-cyan-400" />{" "}
                Full Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  className={inputClass}
                />
                <div className={underline("name")} />
              </div>
            </div>

            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <BsEnvelopeFill className="text-cyan-500 dark:text-cyan-400" />{" "}
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={inputClass}
                />
                <div className={underline("email")} />
              </div>
            </div>

            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <BsChatLeftTextFill className="text-cyan-500 dark:text-cyan-400 text-[11px]" />{" "}
                Transmission Details
              </label>
              <div className="relative flex items-center">
                <textarea
                  required
                  rows="4"
                  placeholder="Enter your query or collaboration objectives..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputClass} resize-none min-h-25`}
                />
                <div className={underline("message", "bg-cyan-400")} />
              </div>
            </div>
          </div>

          {status && (
            <p
              className={`text-xs text-center font-bold px-3 py-2 rounded-xl backdrop-blur-md transition-all ${status.includes("transmitted") ? "text-green-500 bg-green-500/5 border border-green-500/20" : "text-cyan-400 bg-cyan-500/5 border border-cyan-500/20"}`}
            >
              {status}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cyan-200/30 dark:border-cyan-500/20">
            <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium text-center sm:text-left">
              Our support operators validate active streams 24/7.
            </span>
            <div className="relative group w-full sm:w-auto">
              <div
                className="absolute -inset-px rounded-xl opacity-70 group-hover:opacity-100 blur-md transition-opacity duration-300 z-0"
                style={{
                  background: "linear-gradient(135deg, #0891b2, #3b82f6)",
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative z-10 w-full sm:w-auto px-8 md:px-10 py-3.5 font-bold text-sm tracking-wide cursor-pointer text-white bg-linear-to-br from-cyan-600 via-blue-500 to-blue-700 border border-white/20 rounded-xl shadow-lg transition-all duration-300 ease-out hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Transmitting..." : "Transmit Query"}{" "}
                <BsSendFill className="text-xs" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}