import { Link } from "react-router-dom";
import {
  BsHeartPulseFill,
  BsCpuFill,
  BsPeopleFill,
  BsShieldCheck,
  BsLightningCharge,
  BsGraphUp,
  BsAward,
  BsChat,
  BsActivity,
  BsTerminalFill,
  BsFileEarmarkLock2Fill,
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
    icon: BsHeartPulseFill,
    title: "Healthcare Focused",
    desc: "Designed specifically for lung disease triage with clinical precision and care.",
    avatarColor: "from-cyan-500 to-blue-700",
    avatar: "HF",
  },
  {
    icon: BsCpuFill,
    title: "AI Powered",
    desc: "State-of-the-art machine learning models trained on thousands of patient records.",
    avatarColor: "from-blue-500 to-cyan-700",
    avatar: "AI",
  },
  {
    icon: BsShieldCheck,
    title: "Reliable & Accurate",
    desc: "High accuracy predictions trusted by doctors and healthcare professionals.",
    avatarColor: "from-blue-700 to-cyan-500",
    avatar: "RA",
  },
  {
    icon: BsPeopleFill,
    title: "User Friendly",
    desc: "Intuitive interface that hospital staff can use with zero training required.",
    avatarColor: "from-cyan-600 to-blue-700",
    avatar: "UF",
  },
];

const goals = [
  { icon: BsLightningCharge, text: "Faster diagnosis — from hours to seconds" },
  { icon: BsGraphUp, text: "Smart AI-driven patient prioritization" },
  { icon: BsCpuFill, text: "Real-time machine learning predictions" },
  { icon: BsAward, text: "Detailed clinical result reports" },
  { icon: BsChat, text: "AI chat support" },
];

const stats = [
  { value: "95%", label: "Accuracy" },
  { value: "10x", label: "Faster" },
  { value: "24/7", label: "Available" },
  { value: "50+", label: "Hospitals" },
];

const techStack = [
  {
    engine: "Intelligence Core",
    tools: "Python, Flask, PyTorch, Scikit-Learn Model Registry",
  },
  {
    engine: "Interface Gateway",
    tools: "React.js, Tailwind CSS v4, Framer Motion Transitions",
  },
  {
    engine: "Asynchronous Pipelines",
    tools: "Server-Sent Events (SSE), LocalStorage Registry",
  },
];

const complianceBadges = [
  {
    protocol: "HIPAA Privacy Framework",
    validation:
      "End-to-end asymmetric validation isolating patient records and PII tokens.",
  },
  {
    protocol: "HL7 Telemetry Standards",
    validation:
      "Flexible architectural payload mapping intended for seamless HIS connectivity.",
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
      <div className="relative z-10 p-5 md:p-7 rounded-3xl h-full bg-white/80 dark:bg-[#020d1a]/80 backdrop-blur-xl border border-cyan-200/60 dark:border-cyan-500/20 shadow-xl flex flex-col gap-4 transition-all duration-500 group-hover:-translate-y-2 group-hover:border-cyan-400/40 group-hover:shadow-2xl group-hover:shadow-cyan-500/20">
        <div
          className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl shrink-0 bg-linear-to-br ${item.avatarColor} flex items-center justify-center text-white text-lg md:text-xl shadow-lg`}
        >
          <Icon />
        </div>
        <div>
          <h3 className="font-bold text-sm md:text-base mb-1.5 md:mb-2 tracking-wide bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)] transition group-hover:brightness-110">
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

export default function About() {
  const isDark = useTheme();
  return (
    <div
      className="min-h-screen transition-colors duration-300 overflow-y-auto overflow-x-hidden relative p-4 sm:p-6 md:p-10 pt-32 sm:pt-36 pb-16 flex flex-col items-center justify-start w-full"
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

      {/* Main Container - Adjusted max-w-5xl to w-full with responsive X-padding */}
      <div className="relative z-10 w-full flex flex-col gap-10 md:gap-14 mt-6 sm:mt-10 lg:mt-12 px-2 sm:px-6 md:px-12 lg:px-20">
        
        {/* ── HERO ── */}
        <section className="text-center w-full max-w-5xl mx-auto flex flex-col items-center gap-4 px-2 relative z-20">
          <div className="w-full flex items-center justify-center mb-2 md:mb-4 relative z-30">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300/40 text-cyan-600 dark:text-cyan-400 text-[11px] md:text-xs font-bold shadow-xs">
              <BsActivity className="animate-pulse text-cyan-400 text-xs shrink-0" />{" "}
              Technical Architecture Matrix Verified
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-1 tracking-tight leading-[1.15] sm:leading-tight">
            <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent">
              About Our{" "}
            </span>
            <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]">
              Project
            </span>
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base leading-relaxed px-4">
            An AI-powered Medical Triage System that helps hospitals detect lung
            diseases faster, prioritize patients, and make smarter decisions
            using machine learning.
          </p>
        </section>

        {/* ── WHY WE BUILT THIS & GOALS ── */}
        <section className="w-full px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {[
              {
                icon: BsHeartPulseFill,
                avatarColor: "from-cyan-500 to-blue-700",
                title: "Why We Built This",
                paras: [
                  "During emergencies, manual patient evaluation takes valuable time. Delays in diagnosing serious lung conditions can cost lives — every second matters in a critical care scenario.",
                  "Our AI system analyzes symptoms instantly and prioritizes critical patients so doctors can treat them faster, smarter, and more efficiently.",
                ],
              },
              {
                icon: BsAward,
                avatarColor: "from-blue-500 to-cyan-700",
                title: "Project Goals",
                goals: true,
              },
            ].map((card, idx) => (
              <div key={idx} className="group relative w-full">
                <div
                  className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500 z-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #0891b2, #06b6d4, #0e7490)",
                  }}
                />
                <div className="relative z-10 p-6 md:p-8 rounded-3xl h-full bg-white/80 dark:bg-[#020d1a]/80 backdrop-blur-xl border border-cyan-200/60 dark:border-cyan-500/20 shadow-xl flex flex-col gap-4 transition-all duration-500 group-hover:-translate-y-2 group-hover:border-cyan-400/40 group-hover:shadow-2xl group-hover:shadow-cyan-500/20">
                  <div
                    className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-linear-to-br ${card.avatarColor} flex items-center justify-center text-white text-xl shadow-lg`}
                  >
                    <card.icon />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">
                    {card.title}
                  </h2>
                  {card.goals ? (
                    <div className="flex flex-col gap-3">
                      {goals.map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-sm shrink-0">
                            <Icon />
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed">
                            {text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    card.paras.map((p, i) => (
                      <p
                        key={i}
                        className="text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed"
                      >
                        {p}
                      </p>
                    ))
                  )}
                  <div className="h-px bg-linear-to-r from-transparent via-cyan-300/40 dark:via-cyan-500/20 to-transparent mt-auto" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLATFORM DEPLOYMENT STACK ── */}
        <section className="w-full flex flex-col gap-4 px-2">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wide flex items-center justify-center md:justify-start gap-2">
              <BsTerminalFill className="text-blue-500 dark:text-cyan-400 text-base shrink-0" />{" "}
              Platform Deployment Stack
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              High-fidelity technologies mapped to run intelligence core modules
              and routing pipelines synchronously.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {techStack.map((tech, idx) => (
              <div
                key={idx}
                className="bg-white/40 dark:bg-black/30 backdrop-blur-md border border-cyan-200/50 dark:border-cyan-500/15 p-5 rounded-2xl flex flex-col gap-1.5 shadow-md w-full"
              >
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  {tech.engine}
                </h4>
                <p className="text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed">
                  {tech.tools}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECURITY & COMPLIANCE ── */}
        <section className="w-full flex flex-col gap-4 px-2">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-wide flex items-center justify-center md:justify-start gap-2">
              <BsFileEarmarkLock2Fill className="text-blue-500 dark:text-cyan-400 text-base shrink-0" />{" "}
              Security & Integration Blueprints
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Clinical network configurations validating data protection
              standards.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {complianceBadges.map((badge, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white/50 dark:bg-black/40 border border-cyan-200/60 dark:border-cyan-500/20 backdrop-blur-md flex flex-col gap-1 shadow-md hover:border-cyan-400/40 transition-colors w-full"
              >
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {badge.protocol}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">
                  {badge.validation}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── KEY PLATFORM MODULES ── */}
        <section className="w-full flex flex-col gap-5 px-2">
          <div className="text-center mb-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Key Platform Modules
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {features.map((item, i) => (
              <FeatureCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </section>

        {/* ── SYSTEM TELEMETRY / STATS ── */}
        <section className="w-full px-2 pb-10">
          <div className="w-full p-6 md:p-10 rounded-3xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-cyan-200/50 dark:border-cyan-500/15 shadow-xl">
            <h2 className="text-center text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300 mb-6 md:mb-8">
              System Telemetry Matrix
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