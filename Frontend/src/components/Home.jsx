import React from "react";
import { Link } from "react-router-dom";
import {
  BsShieldCheck,
  BsLightningCharge,
  BsGraphUp,
  BsActivity,
  BsLayersHalf,
  BsDatabaseFill,
  BsServer,
  BsClipboardDataFill,
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

const features = [
  {
    icon: BsLightningCharge,
    title: "Fast Diagnosis",
    desc: "ML models instantly analyzes symptoms and predicts patient severity in seconds.",
    avatarColor: "from-cyan-500 to-blue-700",
  },
  {
    icon: BsShieldCheck,
    title: "High Accuracy",
    desc: "Machine learning ensures reliable and consistent results every time.",
    avatarColor: "from-blue-500 to-cyan-700",
  },
  {
    icon: BsGraphUp,
    title: "Smart Prioritization",
    desc: "Critical patients get immediate attention automatically.",
    avatarColor: "from-blue-700 to-cyan-500",
  },
];

const stats = [
  { num: "50+", label: "Hospitals" },
  { num: "200+", label: "Doctors" },
  { num: "1000+", label: "Patients Helped" },
  { num: "5s", label: "Diagnosis Time" },
];

const pipelineSteps = [
  {
    step: "01",
    icon: BsClipboardDataFill,
    title: "Biometric Ingestion",
    desc: "Real-time logging of patient vital parameters, blood oxygen levels (SpO2), and core respiratory symptoms index.",
  },
  {
    step: "02",
    icon: BsLayersHalf,
    title: "Feature Extraction",
    desc: "ML layers map multi-modal categorical indicators and segment diagnostic lung weights asynchronously.",
  },
  {
    step: "03",
    icon: BsActivity,
    title: "Triage Engine",
    desc: "The core neural model dynamically computes severity priority parameters matching international clinical rules.",
  },
  {
    step: "04",
    icon: BsServer,
    title: "Queue Automation",
    desc: "Instantly routes identified critical pulmonology emergency payloads onto the medical dashboard queue.",
  },
];

const datasetMatrix = [
  {
    registry: "MIMIC-IV Chest Dataset",
    records: "15,400+ Triage Logs",
    precision: "0.94 F1-Score",
    status: "Validated",
  },
  {
    registry: "CheXpert Framework Core",
    records: "8,200+ Inputs",
    precision: "0.92 Precision",
    status: "Optimized",
  },
  {
    registry: "Local Clinical Registry",
    records: "1,100+ Live Cases",
    precision: "95.2% Accuracy",
    status: "Active",
  },
];

function FeatureCard({ item, index }) {
  const Icon = item.icon;
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
      <div
        className="
        relative z-10 p-5 md:p-7 rounded-3xl h-full
        bg-white/80 dark:bg-[#020d1a]/80
        backdrop-blur-xl
        border border-cyan-200/60 dark:border-cyan-500/20
        shadow-xl flex flex-col gap-4
        transition-all duration-500
        group-hover:-translate-y-2
        group-hover:border-cyan-400/40 dark:group-hover:border-cyan-400/40
        group-hover:shadow-2xl group-hover:shadow-cyan-500/20
      "
      >
        <div
          className={`
          w-11 h-11 md:w-12 md:h-12 rounded-2xl shrink-0
          bg-linear-to-br ${item.avatarColor}
          flex items-center justify-center
          text-white text-lg md:text-xl shadow-lg
        `}
        >
          <Icon />
        </div>

        <div>
          <h3
            className="
            font-bold text-sm md:text-base mb-1.5 md:mb-2 tracking-wide
            bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800
            bg-clip-text text-transparent
            dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af]
            dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]
            transition group-hover:brightness-110
          "
          >
            {item.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
            {item.desc}
          </p>
        </div>
        <div className="h-px bg-linear-to-r from-transparent via-cyan-300/40 to-transparent mt-auto" />
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
      <div
        className="
        relative z-10 p-4 md:p-6 rounded-2xl
        bg-white/70 dark:bg-white/5
        backdrop-blur-md
        border border-cyan-200/50 dark:border-cyan-500/20
        transition-all duration-300
        group-hover:-translate-y-1
        group-hover:border-cyan-400/50 dark:group-hover:border-cyan-400/30
      "
      >
        <h3 className="text-xl md:text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-0.5 md:mb-1">
          {stat.num}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-[10px] md:text-xs font-semibold uppercase tracking-wider">
          {stat.label}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const isDark = useTheme();

  return (
    <div
      className="min-h-screen transition-colors duration-300 overflow-y-auto overflow-x-hidden relative p-4 sm:p-6 md:p-10 pt-32 sm:pt-40 md:pt-44 lg:pt-24 pb-16 flex flex-col items-center justify-start w-full"
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

      {/* Main Container - Changed max-w-5xl to w-full with responsive responsive X-padding */}
      <div className="relative z-10 w-full flex flex-col gap-12 md:gap-16 mt-4 sm:mt-6 lg:mt-8 px-2 sm:px-6 md:px-12 lg:px-20">
        {/* ── HERO ── */}
        <section className="text-center w-full max-w-5xl mx-auto flex flex-col items-center gap-4 md:gap-5 px-2 relative z-20">
          <div className="w-full flex items-center justify-center mb-1 md:mb-3 relative z-30">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300/40 text-cyan-600 dark:text-cyan-400 text-[11px] md:text-xs font-bold shadow-md">
              <BsActivity className="animate-pulse text-cyan-400 text-xs shrink-0" />{" "}
              Active Pulmonology Diagnosis Layer
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] sm:leading-tight mt-1 md:mt-2">
            <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent tracking-wide block sm:inline">
              Smart Medical{" "}
            </span>
            <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)] tracking-wide block sm:inline">
              Triage System
            </span>
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed px-4">
            AI-powered lung disease prediction & patient prioritization platform
            that helps hospitals diagnose faster and save more lives.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full px-4 max-w-md mx-auto sm:max-w-none">
            <div className="relative group w-full sm:w-auto">
              <div
                className="absolute -inset-px rounded-xl opacity-70 group-hover:opacity-100 blur-md transition-opacity duration-300 z-0"
                style={{
                  background: "linear-gradient(135deg, #0891b2, #3b82f6)",
                }}
              />
              <Link
                to="/dashboard"
                className="relative z-10 flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 font-bold text-sm tracking-wide text-white bg-linear-to-br from-cyan-600 via-blue-500 to-blue-700 border border-white/20 rounded-xl shadow-lg transition-all hover:brightness-110 active:scale-95"
              >
                Start Assessment 🚀
              </Link>
            </div>

            <Link
              to="/about"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 font-bold text-sm tracking-wide text-cyan-600 dark:text-cyan-400 rounded-xl bg-white/40 dark:bg-white/5 border border-cyan-400/40 dark:border-cyan-500/30 transition-all hover:bg-cyan-50 dark:hover:bg-white/10"
            >
              Learn More →
            </Link>
          </div>
        </section>

        {/* ── CARD GRID ── */}
        <section className="w-full flex flex-col gap-5 px-2">
          <div className="text-center mb-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Built for Speed & Accuracy
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
            {features.map((item, i) => (
              <FeatureCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </section>

        {/* ── PIPELINE ── */}
        <section className="w-full flex flex-col gap-5 px-2">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wide flex items-center justify-center md:justify-start gap-2">
              <BsLayersHalf className="text-blue-500 dark:text-cyan-400 text-base shrink-0" />{" "}
              Neural Processing Pipeline
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Asynchronous sequential flow from data ingestion to active
              dashboard queue localization.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl p-5 bg-white/50 dark:bg-black/40 border border-cyan-200/60 dark:border-cyan-500/20 backdrop-blur-md shadow-sm flex flex-col gap-3 group hover:border-cyan-500/40 transition-colors w-full"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm shadow-sm">
                      <Icon />
                    </div>
                    <span className="text-2xl font-black text-cyan-600/15 dark:text-cyan-500/10 font-mono tracking-tighter">
                      {step.step}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── DATASET MATRIX ── */}
        <section className="w-full flex flex-col gap-4 px-2">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wide flex items-center justify-center md:justify-start gap-2">
              <BsDatabaseFill className="text-blue-500 dark:text-cyan-400 text-base shrink-0" />{" "}
              Validation Registry Matrices
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Statistical training checkpoints and benchmark validation accuracy
              parameters verified under peer review.
            </p>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-cyan-200/60 dark:border-cyan-500/20 bg-white/40 dark:bg-black/40 backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-150">
                <thead>
                  <tr className="border-b border-cyan-200/60 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-white/5 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    <th className="py-3.5 px-4 md:px-5">
                      Dataset Registry Profile
                    </th>
                    <th className="py-3.5 px-4 md:px-5">Evaluated Records</th>
                    <th className="py-3.5 px-4 md:px-5">
                      Model Precision Rate
                    </th>
                    <th className="py-3.5 px-4 md:px-5 text-right">
                      Node State
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-700 dark:text-slate-300 divide-y divide-cyan-200/40 dark:divide-cyan-500/10">
                  {datasetMatrix.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-cyan-50/30 dark:hover:bg-white/2 transition-colors"
                    >
                      <td className="py-3.5 px-4 md:px-5 font-bold text-slate-800 dark:text-slate-200">
                        {row.registry}
                      </td>
                      <td className="py-3.5 px-4 md:px-5 text-slate-500 dark:text-slate-400">
                        {row.records}
                      </td>
                      <td className="py-3.5 px-4 md:px-5 font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                        {row.precision}
                      </td>
                      <td className="py-3.5 px-4 md:px-5 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                          <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />{" "}
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="w-full px-2 pb-10">
          <div className="w-full p-6 md:p-10 rounded-3xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-cyan-200/50 dark:border-cyan-500/15 shadow-xl">
            <h2 className="text-center text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300 mb-6 md:mb-8">
              Trusted by Hospitals Across India
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
