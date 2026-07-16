import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BsStarFill,
  BsStarHalf,
  BsQuote,
  BsCheckCircleFill,
  BsLayoutTextWindowReverse,
  BsShieldLockFill,
  BsHourglassSplit,
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

const reviews = [
  {
    id: 1,
    name: "Dr. Ananya Roy",
    role: "Pulmonologist",
    avatar: "AR",
    avatarColor: "from-cyan-500 to-blue-700",
    text: "This AI triage system helps us detect critical lung patients instantly and saves precious time. An absolute game-changer for emergency care.",
    rating: 5,
    hospital: "AIIMS Delhi",
  },
  {
    id: 2,
    name: "Rahul Sen",
    role: "Hospital Staff",
    avatar: "RS",
    avatarColor: "from-blue-500 to-cyan-700",
    text: "Very easy interface and fast predictions. Staff can use it without any training. It has streamlined our entire triage workflow.",
    rating: 4.5,
    hospital: "Apollo Hospitals",
  },
  {
    id: 3,
    name: "Priyanka Sharma",
    role: "Patient",
    avatar: "PS",
    avatarColor: "from-blue-700 to-cyan-500",
    text: "Doctors attended me quickly thanks to the smart prioritization system. I felt safe and cared for from the moment I arrived.",
    rating: 5,
    hospital: "Fortis Healthcare",
  },
];

const stats = [
  { value: "4.9/5", label: "Average Rating" },
  { value: "1000+", label: "Happy Users" },
  { value: "50+", label: "Hospitals" },
  { value: "99%", label: "Satisfaction" },
];

const auditTabs = [
  {
    id: "practitioner",
    label: "Medical Practitioner View",
    icon: BsLayoutTextWindowReverse,
    headline: "Clinical Decision Overlap Index",
    metric: "94.6% Overlap Match",
    detail:
      "Neural predictions cross-referenced dynamically against senior pulmonologist diagnostic validations demonstrate absolute consistency.",
  },
  {
    id: "er-nurse",
    label: "ER Operations View",
    icon: BsHourglassSplit,
    headline: "Queue Throughput Latency Reduction",
    metric: "62% Wait Time Drop",
    detail:
      "Frontline triage processing windows reduced from hours down to seconds, effectively stabilizing emergency ward congestion points.",
  },
  {
    id: "it-auditor",
    label: "IT Infrastructure View",
    icon: BsShieldLockFill,
    headline: "Payload Cryptographic Latency",
    metric: "<45ms Transport Overhead",
    detail:
      "End-to-end asymmetric transport verification processes validate secure transit cycles while perfectly protecting data profiles.",
  },
];

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 !== 0;
  return (
    <div className="flex gap-1 text-yellow-400">
      {[...Array(full)].map((_, i) => (
        <BsStarFill key={i} className="text-sm" />
      ))}
      {half && <BsStarHalf className="text-sm" />}
    </div>
  );
}

// Full screen width friendly review cards
function ReviewCard({ review, index }) {
  return (
    <div
      className="group relative w-full"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div
        className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500 z-0"
        style={{
          background: "linear-gradient(135deg, #0891b2, #06b6d4, #0e7490)",
        }}
      />
      <div className="relative z-10 p-5 md:p-7 rounded-3xl h-full bg-white/80 dark:bg-[#020d1a]/80 backdrop-blur-xl border border-cyan-200/60 dark:border-cyan-500/20 shadow-xl flex flex-col gap-4 transition-all duration-500 group-hover:-translate-y-2 group-hover:border-cyan-400/40 group-hover:shadow-2xl group-hover:shadow-cyan-500/20">
        <div className="text-cyan-400/40 dark:text-cyan-500/30">
          <BsQuote style={{ fontSize: 36 }} />
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed flex-1">
          "{review.text}"
        </p>
        <StarRating rating={review.rating} />
        <div className="h-px bg-linear-to-r from-transparent via-cyan-300/40 to-transparent mt-auto" />
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl shrink-0 bg-linear-to-br ${review.avatarColor} flex items-center justify-center text-white text-sm font-bold shadow-lg`}
          >
            {review.avatar}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">
              <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]">
                {review.name}
              </span>
            </p>
            <p className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
              {review.role}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
              {review.hospital}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ stat, index }) {
  return (
    <div
      className="group relative text-center w-full"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500 z-0"
        style={{ background: "linear-gradient(135deg, #0891b2, #06b6d4)" }}
      />
      <div className="relative z-10 p-4 md:p-6 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-cyan-200/50 dark:border-cyan-500/20 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-cyan-400/50">
        <h3 className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-0.5 md:mb-1">
          {stat.value}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
          {stat.label}
        </p>
      </div>
    </div>
  );
}

export default function Review() {
  const isDark = useTheme();
  const [activeTab, setActiveTab] = useState("practitioner");

  return (
    <div
      className="min-h-screen transition-colors duration-300 overflow-y-auto overflow-x-hidden relative p-4 sm:p-6 md:p-10 pt-24 sm:pt-28 pb-16 flex flex-col items-center justify-start w-full"
      style={isDark ? darkBg : lightBg}
    >
      <MedicalConstellation />
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute top-20 left-1/4 w-72 h-72 md:w-96 md:h-96 rounded-full opacity-0 dark:opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, #0891b2, transparent)",
          }}
        />
        <div
          className="absolute bottom-40 right-1/4 w-64 h-64 md:w-80 md:h-80 rounded-full opacity-0 dark:opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, #06b6d4, transparent)",
          }}
        />
      </div>

      {/* Main Container expanded to w-full with responsive X-padding */}
      <div className="relative z-10 w-full flex flex-col gap-10 md:gap-14 mt-4 sm:mt-6 px-2 sm:px-6 md:px-12 lg:px-20">
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto flex flex-col gap-3 md:gap-4 px-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-1 tracking-tight leading-[1.15] sm:leading-tight">
            <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent">
              What People{" "}
            </span>
            <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]">
              Are Saying
            </span>
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed px-4">
            Doctors, staff, and patients trust our system for faster and smarter
            medical decisions every day.
          </p>
        </section>

        {/* REVIEWS GRID */}
        <section className="w-full px-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {reviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>
        </section>

        {/* AUDIT TABS / OPERATIONAL CHANNELS */}
        <section className="w-full flex flex-col gap-5 px-2">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wide flex items-center justify-center md:justify-start gap-2">
              <BsLayoutTextWindowReverse className="text-blue-500 dark:text-cyan-400 text-base shrink-0" />{" "}
              Operational Verification Channels
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Toggle between clinical, operational, and database audits to
              verify deployment benchmarks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start w-full">
            {/* Sidebar Tab Triggers */}
            <div className="md:col-span-4 flex flex-col gap-2 w-full">
              {auditTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer
                      ${
                        activeTab === tab.id
                          ? "bg-white/80 dark:bg-black/50 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-md"
                          : "bg-white/30 dark:bg-white/2 border-transparent text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5"
                      }`}
                  >
                    <TabIcon className="text-base text-cyan-500/80 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Active Tab Content Card */}
            <div className="md:col-span-8 p-5 md:p-6 rounded-2xl bg-white/50 dark:bg-black/40 border border-cyan-200/60 dark:border-cyan-500/20 backdrop-blur-md shadow-xl min-h-[160px] flex flex-col justify-between w-full">
              {auditTabs
                .filter((t) => t.id === activeTab)
                .map((current) => (
                  <div key={current.id} className="flex flex-col gap-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 border-b border-cyan-200/30 dark:border-cyan-500/10 pb-3">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <BsCheckCircleFill className="text-green-500 text-xs shrink-0" />{" "}
                        {current.headline}
                      </h4>
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 px-2.5 py-0.5 rounded-full border border-cyan-500/10 self-start sm:self-center">
                        {current.metric}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
                      {current.detail}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* SYSTEM STATS / TELEMETRY */}
        <section className="w-full px-2 pb-10">
          <div className="w-full p-6 md:p-10 rounded-3xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-cyan-200/50 dark:border-cyan-500/15 shadow-xl">
            <h2 className="text-center text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300 mb-6 md:mb-8">
              Trusted Across India
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 w-full">
              {stats.map((stat, i) => (
                <StatCard key={stat.label} stat={stat} index={i} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
