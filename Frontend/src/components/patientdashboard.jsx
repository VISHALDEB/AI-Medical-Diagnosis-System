import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FiUser,
  FiActivity,
  FiUpload,
  FiImage,
  FiX,
  FiCheckCircle,
  FiCpu,
  FiChevronRight,
  FiChevronLeft,
  FiAlertCircle,
  FiClock,
  FiHeart,
  FiZap,
  FiInfo,
  FiShield,
  FiBarChart2,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";
import ReportDetails from "./ReportDetails";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const STORAGE_KEY = "mediscan_patient_form_v2";

const CORE_SYMPTOMS = [
  { id: "cough", label: "Cough" },
  { id: "fever", label: "Fever" },
  { id: "breathlessness", label: "Breathlessness" },
  { id: "wheezing", label: "Wheezing" },
  { id: "chest_pain", label: "Chest Pain" },
  { id: "fatigue", label: "Fatigue" },
];

const SEVERITY_LABELS = {
  cough: [
    "None",
    "Mild — occasional dry cough",
    "Moderate — frequent or productive cough",
    "Severe — persistent, chronic, or blood-stained cough",
  ],
  fever: [
    "None",
    "Low-grade — mild warmth or slight temperature",
    "Moderate — clear fever, may come and go",
    "High — persistent high fever with chills",
  ],
  breathlessness: [
    "None",
    "Mild — only on exertion or climbing stairs",
    "Moderate — on minimal activity or worsening over weeks",
    "Severe — at rest, sudden onset, or rapidly worsening",
  ],
  wheezing: [
    "None",
    "Occasional — only during specific triggers (dust, cold, exercise)",
    "Frequent — episodic wheeze with chest tightness",
    "Constant — severe wheeze, breathlessness at rest during attack",
  ],
  chest_pain: [
    "None",
    "Mild — dull ache or mild discomfort",
    "Moderate — sharp or worsening with breathing",
    "Severe — sudden sharp pain, worsens breathing deeply",
  ],
  fatigue: [
    "None",
    "Mild — tired but functional",
    "Moderate — significantly limits daily activity",
    "Severe — debilitating, unable to carry out normal tasks",
  ],
};

const ADVANCED_MAP = {
  cough: [
    {
      id: "chronic_cough_3w",
      label: "Has the cough been continuous for more than 3 weeks?",
      tooltip:
        "A cough lasting 3+ weeks is the TB alarm rule. It also appears in Lung Cancer and Pulmonary Fibrosis.",
    },
    {
      id: "blood_in_cough",
      label: "Any blood in the cough — even just small streaks?",
      tooltip:
        "Haemoptysis is a key flag for Lung Cancer (85%) and severe TB (60%). Absent in Asthma and Fibrosis.",
    },
    {
      id: "smell_taste_loss",
      label: "Complete loss of smell or taste alongside the cough?",
      tooltip:
        "Loss of smell/taste is a Covid-19 exclusive signal (~85%). No other disease in this model causes this.",
    },
    {
      id: "muscle_aches",
      label: "Muscle aches or body pain separate from the chest?",
      tooltip:
        "Myalgia occurs in ~70% of Covid-19 cases. Completely absent in Fibrosis, Asthma, PE, Cancer, and TB.",
    },
  ],
  fever: [
    {
      id: "drenching_sweats",
      label: "Night sweats severe enough to soak clothes or sheets?",
      tooltip:
        "Drenching night sweats are TB's most exclusive symptom (~92%). Absent in all other 5 diseases.",
    },
    {
      id: "tb_exposure",
      label:
        "Contact with a known TB patient or travel to a high-burden country?",
      tooltip:
        "TB exposure history is decisive. No other disease here has an infectious exposure pathway.",
    },
    {
      id: "unexplained_wt",
      label:
        "Unintentional weight loss of several kilograms alongside the fever?",
      tooltip:
        "Significant weight loss with fever is a TB hallmark. Also seen in Lung Cancer, but TB has evening-peak fever.",
    },
  ],
  breathlessness: [
    {
      id: "minutes_onset",
      label: "Did breathlessness come on within minutes — not hours or days?",
      tooltip:
        "PE onset is measured in minutes. Any slower onset eliminates Pulmonary Embolism from consideration.",
    },
    {
      id: "leg_swelling",
      label: "One leg swollen, red, or painful?",
      tooltip:
        "DVT-to-PE pathway. Leg swelling is completely unique to Pulmonary Embolism — absent in all other 5 diseases.",
    },
    {
      id: "immobility_risk",
      label: "Recent long flight, surgery, bed rest, or prolonged immobility?",
      tooltip:
        "Clot-forming risk factors are the PE separator. None of the other diseases have this trigger.",
    },
    {
      id: "velcro_crackles",
      label: "Crackling sound like velcro when breathing in deeply?",
      tooltip:
        "Velcro crackles are pathognomonic for Pulmonary Fibrosis (~95%). No other disease in this model produces this.",
    },
    {
      id: "monthly_worsening",
      label: "Breathlessness slowly worsening every month over 3+ months?",
      tooltip:
        "Gradual monthly deterioration is Pulmonary Fibrosis's exclusive trajectory — no episodic pattern.",
    },
  ],
  wheezing: [
    {
      id: "normal_between",
      label:
        "Completely normal between wheezing episodes — no symptoms at all?",
      tooltip:
        "Full recovery between episodes is Asthma's exclusive pattern. No other disease here resolves then returns.",
    },
    {
      id: "specific_trigger",
      label:
        "Can you name a specific trigger — cold air, pollen, exercise, dust?",
      tooltip:
        "Trigger-driven onset is unique to Asthma. Other diseases have no specific identifiable trigger.",
    },
    {
      id: "inhaler_relief",
      label: "Does a reliever inhaler stop the attack within minutes?",
      tooltip:
        "Rapid bronchodilator reversal confirms Asthma. No other disease here responds this way.",
    },
  ],
  chest_pain: [
    {
      id: "minutes_onset",
      label: "Did chest pain come on suddenly within minutes?",
      tooltip:
        "Sudden chest pain with breathlessness within minutes is the hallmark of Pulmonary Embolism.",
    },
    {
      id: "leg_swelling",
      label: "One leg swollen, red, or painful at the same time?",
      tooltip:
        "Leg swelling alongside chest pain strongly points to PE (DVT-to-PE pathway). Unique to embolism.",
    },
    {
      id: "new_hoarseness",
      label: "Has your voice become hoarse or raspy recently without a cold?",
      tooltip:
        "Recurrent laryngeal nerve compression is a Lung Cancer-exclusive sign. Absent in every other disease.",
    },
    {
      id: "cancer_wt_loss",
      label: "Unintentional weight loss alongside chest symptoms?",
      tooltip:
        "Rapid weight loss with chest pain points to Lung Cancer. TB shares weight loss but has night sweats.",
    },
  ],
  fatigue: [
    {
      id: "drenching_sweats",
      label: "Night sweats severe enough to soak clothes or sheets?",
      tooltip:
        "Night sweats + fatigue is TB's most exclusive combination (~92%). Absent in all other 5 diseases.",
    },
    {
      id: "unexplained_wt",
      label: "Unintentional weight loss of several kilograms recently?",
      tooltip:
        "Weight loss with fatigue appears in TB and Lung Cancer. TB has night sweats; Cancer has hoarseness.",
    },
    {
      id: "new_hoarseness",
      label: "Voice become hoarse or raspy recently without any cold?",
      tooltip:
        "Hoarseness with fatigue = Lung Cancer signal (recurrent laryngeal nerve compression). Unique to cancer.",
    },
    {
      id: "blood_in_cough",
      label: "Any blood in cough alongside the fatigue?",
      tooltip:
        "Haemoptysis + fatigue points to Lung Cancer (92% at severity 2+) or severe TB. Context separates them.",
    },
  ],
};

const SMOKING_OPTS = [
  { id: "non_smoker", label: "Non-Smoker", desc: "Never smoked" },
  { id: "former", label: "Former Smoker", desc: "Quit smoking" },
  { id: "occasional", label: "Occasional", desc: "Social / rare" },
  { id: "regular", label: "Regular Smoker", desc: "Daily smoker" },
  { id: "heavy", label: "Heavy Smoker", desc: "20+ cigarettes/day" },
];

const DURATION_OPTS = [
  { id: "1_3_days", label: "1–3 Days", icon: "📅", hint: "Likely acute" },
  { id: "1_week", label: "~1 Week", icon: "📅", hint: "Subacute" },
  { id: "1_month", label: "~1 Month", icon: "🗓️", hint: "Prolonged" },
  { id: "3_months", label: "3+ Months", icon: "📆", hint: "Chronic" },
];

const STEPS_NO_XRAY = [
  { id: 1, short: "Info", label: "Patient Info", icon: FiUser },
  { id: 2, short: "Symptoms", label: "Core Symptoms", icon: FiHeart },
  { id: 3, short: "Follow-up", label: "AI Follow-ups", icon: FiZap },
  { id: 4, short: "Smoking", label: "Smoking History", icon: FiActivity },
  { id: 5, short: "Duration", label: "Duration", icon: FiClock },
];

const STEPS_XRAY_ONLY = [
  { id: 1, short: "Info", label: "Patient Info", icon: FiUser },
  { id: 2, short: "X-Ray", label: "X-Ray Upload", icon: FiUpload },
];

const STEPS_HYBRID = [
  { id: 1, short: "Info", label: "Patient Info", icon: FiUser },
  { id: 2, short: "Symptoms", label: "Core Symptoms", icon: FiHeart },
  { id: 3, short: "Follow-up", label: "AI Follow-ups", icon: FiZap },
  { id: 4, short: "Smoking", label: "Smoking History", icon: FiActivity },
  { id: 5, short: "Duration", label: "Duration", icon: FiClock },
  { id: 6, short: "X-Ray", label: "X-Ray Upload", icon: FiUpload },
];

/* ═══════════════════════════════════════════════════════════════
   STYLE TOKENS
═══════════════════════════════════════════════════════════════ */
const gText = [
  "bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-700 bg-clip-text text-transparent",
  "dark:from-cyan-100 dark:via-white dark:to-cyan-300",
  "dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)] tracking-tight",
].join(" ");

const cardCls = [
  "bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl",
  "border border-cyan-100/80 dark:border-cyan-500/10 rounded-2xl shadow-xl shadow-cyan-950/5 dark:shadow-black/30",
].join(" ");

const inputCls = [
  "w-full bg-transparent border-b border-slate-300 dark:border-slate-700 py-2.5 text-sm",
  "focus:border-cyan-500 dark:focus:border-cyan-400 outline-none transition-colors dark:text-slate-200",
  "placeholder:text-slate-400/50",
].join(" ");

const selectCls = [
  "w-full bg-transparent border-b border-slate-300 dark:border-slate-700 py-2.5 text-sm",
  "focus:border-cyan-500 dark:focus:border-cyan-400 outline-none transition-colors dark:text-slate-200",
].join(" ");
/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */
function AnimatedSection({ children, dir }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = dir === "back" ? "-44px" : "44px";
    el.style.cssText = `opacity:0;transform:translateX(${from})`;
    const raf = requestAnimationFrame(() => {
      el.style.transition =
        "opacity 0.38s cubic-bezier(.4,0,.2,1),transform 0.38s cubic-bezier(.4,0,.2,1)";
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
    return () => cancelAnimationFrame(raf);
  }, [dir]);
  return <div ref={ref}>{children}</div>;
}

function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="w-4 h-4 rounded-full flex items-center justify-center text-cyan-400 hover:text-cyan-500 transition-colors shrink-0"
      >
        <FiInfo size={12} />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 animate-tooltip">
          <div className="bg-slate-900 dark:bg-slate-800 border border-cyan-500/20 text-white text-[10px] leading-relaxed rounded-xl px-3 py-2.5 shadow-2xl">
            {text}
          </div>
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #1e293b",
            }}
          />
        </div>
      )}
    </div>
  );
}

function SeveritySlider({ symptomId, value, onChange }) {
  const labels = SEVERITY_LABELS[symptomId] || [
    "None",
    "Mild",
    "Moderate",
    "Severe",
  ];
  const pct = (value / (labels.length - 1)) * 100;
  const trackColors = ["#94a3b8", "#f59e0b", "#f97316", "#ef4444"];
  const col = trackColors[Math.min(value, trackColors.length - 1)];
  return (
    <div className="space-y-2 pt-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
          Severity
        </span>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all duration-300"
          style={{ background: `${col}22`, color: col }}
        >
          {labels[value]}
        </span>
      </div>
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
        <div
          className="absolute h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right,#7c3aed,${col})`,
          }}
        />
        <input
          type="range"
          min={0}
          max={labels.length - 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer opacity-0 h-full"
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, background: col }}
        />
      </div>
      <div className="flex justify-between">
        {labels.map((l, i) => (
          <span
            key={i}
            className={`text-[9px] font-semibold transition-colors duration-200 ${i === value ? "text-cyan-500" : "text-slate-400/50"}`}
          >
            {l.split(" — ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepIndicator({ current, done, steps }) {
  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="flex items-center min-w-max mx-auto">
        {steps.map((s, i) => {
          const isDone = done.includes(s.id);
          const isActive = current === s.id;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5 min-w-13">
                <div
                  className={[
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 text-xs font-bold",
                    isDone
                      ? "bg-linear-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                      : isActive
                        ? "bg-white/60 dark:bg-slate-800/80 border-2 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-md shadow-cyan-500/10"
                        : "bg-white/30 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 text-slate-400",
                  ].join(" ")}
                >
                  {isDone ? <FiCheckCircle size={14} /> : <Icon size={13} />}
                </div>
                <span
                  className={[
                    "text-[9px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors",
                    isActive
                      ? "text-cyan-500"
                      : isDone
                        ? "text-slate-500 dark:text-slate-400"
                        : "text-slate-400/50",
                  ].join(" ")}
                >
                  {s.short}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={[
                    "h-px flex-1 mx-1 mb-5 transition-all duration-500 min-w-4",
                    isDone
                      ? "bg-cyan-500/50"
                      : "bg-slate-200 dark:bg-slate-700",
                  ].join(" ")}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function CardHeader({ title, Icon }) {
  return (
    <div className="px-5 py-3.5 border-b border-white/30 dark:border-white/5 flex items-center justify-between bg-white/30 dark:bg-slate-900/30">
      <span
        className={`text-[11px] font-black uppercase tracking-widest ${gText}`}
      >
        {title}
      </span>
      <Icon className="text-cyan-500" size={16} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PERSISTENCE
═══════════════════════════════════════════════════════════════ */
const loadSaved = () => {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};
const saveState = (s) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};
const clearSaved = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

function getInitial() {
  const s = loadSaved();
  if (s) return s;
  return {
    mode: null,
    step: 1,
    done: [],
    name: "",
    age: "",
    gender: "",
    coreSelected: [],
    severity: {},
    advAnswers: {},
    smoking: "",
    duration: "",
    hasXray: null,
  };
}

/* ═══════════════════════════════════════════════════════════════
   BACKEND PAYLOAD BUILDER
═══════════════════════════════════════════════════════════════ */
function buildBackendPayload(
  coreSelected,
  severity,
  advAnswers,
  smoking,
  duration,
) {
  const sev = {};
  const cough = coreSelected.includes("cough") ? (severity["cough"] ?? 0) : 0;
  const fever = coreSelected.includes("fever") ? (severity["fever"] ?? 0) : 0;
  const breath = coreSelected.includes("breathlessness")
    ? (severity["breathlessness"] ?? 0)
    : 0;
  const wheezing = coreSelected.includes("wheezing")
    ? (severity["wheezing"] ?? 0)
    : 0;
  const chest_pain = coreSelected.includes("chest_pain")
    ? (severity["chest_pain"] ?? 0)
    : 0;
  const fatigue = coreSelected.includes("fatigue")
    ? (severity["fatigue"] ?? 0)
    : 0;
  const adv = advAnswers;

  const hasCovid = adv.smell_taste_loss || adv.muscle_aches;
  sev["covid19"] = hasCovid
    ? Math.max(cough, fever, 1)
    : cough > 0 && fever > 0
      ? Math.min(cough, fever)
      : 0;

  sev["pulmonary_fibrosis"] =
    adv.velcro_crackles || adv.monthly_worsening
      ? Math.max(cough, breath, 1)
      : cough > 0 && breath > 0 && !fever
        ? Math.max(cough, breath)
        : 0;

  sev["pulmonary_embolism"] =
    adv.minutes_onset || adv.leg_swelling || adv.immobility_risk
      ? Math.max(breath, chest_pain, 1)
      : breath > 0 && chest_pain > 0
        ? Math.max(breath, chest_pain)
        : 0;

  sev["tuberculosis"] =
    adv.drenching_sweats || adv.tb_exposure || adv.chronic_cough_3w
      ? Math.max(cough, fatigue, 1)
      : cough > 0 && (fever > 0 || fatigue > 0)
        ? Math.max(cough, fatigue, fever)
        : 0;

  sev["asthma"] =
    wheezing > 0
      ? wheezing
      : adv.normal_between || adv.specific_trigger || adv.inhaler_relief
        ? 1
        : 0;

  sev["lung_cancer"] =
    adv.blood_in_cough || adv.new_hoarseness || adv.cancer_wt_loss
      ? Math.max(cough, fatigue, breath, 1)
      : cough > 0 && fatigue > 0
        ? Math.max(cough, fatigue)
        : 0;

  // ✅ Safety net — prevents the all-zeros 400 error
  const allZero = Object.values(sev).every((v) => v === 0);
  if (allZero) {
    if (cough > 0) sev["tuberculosis"] = cough;
    if (fever > 0) sev["covid19"] = fever;
    if (breath > 0) sev["pulmonary_embolism"] = breath;
    if (wheezing > 0) sev["asthma"] = wheezing;
    if (chest_pain > 0)
      sev["pulmonary_embolism"] = Math.max(
        sev["pulmonary_embolism"] ?? 0,
        chest_pain,
      );
    if (fatigue > 0) sev["lung_cancer"] = fatigue;
  }

  return { severity: sev, advAnswers, smoking, duration };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function PatientDashboard({ setActiveView }) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
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

  const [view, setView] = useState("mode-select");
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [apiError, setApiError] = useState("");
  const [predictionResult, setPredictionResult] = useState(null);

  const init = useRef(getInitial());
  const hasSaved = useRef(!!loadSaved());

  const [mode, setMode] = useState(init.current.mode);
  const [step, setStep] = useState(init.current.step);
  const [done, setDone] = useState(init.current.done);
  const [dir, setDir] = useState("fwd");
  const [name, setName] = useState(init.current.name);
  const [age, setAge] = useState(init.current.age);
  const [gender, setGender] = useState(init.current.gender);
  const [coreSelected, setCoreSelected] = useState(init.current.coreSelected);
  const [severity, setSeverity] = useState(init.current.severity);
  const [advAnswers, setAdvAnswers] = useState(init.current.advAnswers);
  const [smoking, setSmoking] = useState(init.current.smoking);
  const [duration, setDuration] = useState(init.current.duration);
  const [hasXray, setHasXray] = useState(init.current.hasXray);
  const [xrayUrl, setXrayUrl] = useState(null);
  const [xrayFile, setXrayFile] = useState(null);

  const STEPS =
    mode === "xray"
      ? STEPS_XRAY_ONLY
      : mode === "hybrid"
        ? STEPS_HYBRID
        : STEPS_NO_XRAY;
  const totalSteps = STEPS.length;

  const isXrayStep =
    (mode === "xray" && step === 2) || (mode === "hybrid" && step === 6);
  const isSubmitStep = (mode === "no-xray" && step === 5) || isXrayStep;

  const getSymptomWarnings = () => {
    const w = [];
    if (advAnswers.unexplained_wt && duration === "1_3_days")
      w.push("⚠️ Weight loss takes weeks — please recheck duration");
    if (
      (advAnswers.minutes_onset || advAnswers.leg_swelling) &&
      ["1_month", "3_months"].includes(duration)
    )
      w.push("⚠️ PE is always sudden — duration seems too long");
    if (
      (advAnswers.new_hoarseness || advAnswers.cancer_wt_loss) &&
      ["1_3_days", "1_week"].includes(duration)
    )
      w.push("⚠️ Lung Cancer develops over months — duration too short");
    if (
      (advAnswers.drenching_sweats || advAnswers.tb_exposure) &&
      ["1_3_days", "1_week"].includes(duration)
    )
      w.push("⚠️ TB develops over weeks/months — duration too short");
    if (
      (advAnswers.velcro_crackles || advAnswers.monthly_worsening) &&
      ["1_3_days", "1_week"].includes(duration)
    )
      w.push("⚠️ Pulmonary Fibrosis develops over months — duration too short");
    return w;
  };
  const symptomWarnings =
    mode === "no-xray" && step === 5 ? getSymptomWarnings() : [];

  useEffect(() => {
    if (hasSaved.current && init.current.mode) {
      setShowRestoreBanner(true);
      setView("form");
    }
  }, []);

  const persistState = useCallback(() => {
    saveState({
      mode,
      step,
      done,
      name,
      age,
      gender,
      coreSelected,
      severity,
      advAnswers,
      smoking,
      duration,
      hasXray,
    });
  }, [
    mode,
    step,
    done,
    name,
    age,
    gender,
    coreSelected,
    severity,
    advAnswers,
    smoking,
    duration,
    hasXray,
  ]);
  useEffect(() => {
    persistState();
  }, [persistState]);

  const goNext = () => {
    setDone((p) => [...new Set([...p, step])]);
    setDir("fwd");
    setStep((s) => Math.min(s + 1, totalSteps));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };
  const goBack = () => {
    setDir("back");
    setStep((s) => Math.max(s - 1, 1));
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const resetAll = () => {
    clearSaved();
    setMode(null);
    setStep(1);
    setDone([]);
    setDir("fwd");
    setName("");
    setAge("");
    setGender("");
    setCoreSelected([]);
    setSeverity({});
    setAdvAnswers({});
    setSmoking("");
    setDuration("");
    setHasXray(null);
    setXrayUrl(null);
    setXrayFile(null);
    setShowRestoreBanner(false);
    setApiError("");
    setPredictionResult(null);
    setView("mode-select");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToXray = () => {
    if (mode === "hybrid") {
      setDir("fwd");
      setStep(6);
      setView("form");
    } else if (mode === "xray") {
      setDir("fwd");
      setStep(2);
      setView("form");
    } else resetAll();
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const selectMode = (m) => {
    setMode(m);
    setStep(1);
    setDone([]);
    setDir("fwd");
    setView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const advOptions = React.useMemo(() => {
    const seen = new Set(),
      out = [];
    coreSelected.forEach((sid) =>
      (ADVANCED_MAP[sid] || []).forEach((opt) => {
        if (!seen.has(opt.id)) {
          seen.add(opt.id);
          out.push(opt);
        }
      }),
    );
    return out;
  }, [coreSelected]);

  const toggleCore = (id) => {
    setCoreSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
    setSeverity((p) => ({ ...p, [id]: p[id] ?? 1 }));
  };
  const toggleAdv = (id) => setAdvAnswers((p) => ({ ...p, [id]: !p[id] }));

  const canProceed = () => {
    if (step === 1) return !!(name.trim() && age && gender);
    if (mode === "xray" && step === 2) return !!xrayUrl;
    if (step === 2) return coreSelected.length > 0;
    if (step === 3) return true;
    if (step === 4) return !!smoking;
    if (step === 5) return !!duration;
    if (step === 6) return !!xrayUrl;
    return true;
  };

  /* ── Build human-readable form summary (for report + PDF) ──
     This always reflects exactly what the patient entered in the form,
     regardless of what the backend echoes back. Used to enrich the
     predictionResult so the generated PDF/report shows every input:
     symptoms + severity, AI follow-up answers, smoking history, and
     symptom duration. ── */
  const buildSymptomSummary = () => {
    const symptomsPlain = coreSelected.map(
      (sid) => CORE_SYMPTOMS.find((c) => c.id === sid)?.label || sid,
    );

    const symptomsDetailed = coreSelected.map((sid) => {
      const label = CORE_SYMPTOMS.find((c) => c.id === sid)?.label || sid;
      const idx = severity[sid] ?? 1;
      const sevFull =
        (SEVERITY_LABELS[sid] || ["None", "Mild", "Moderate", "Severe"])[
          idx
        ] || "";
      const sevShort = sevFull.split(" — ")[0];
      return `${label} — ${sevShort}`;
    });

    const advList = advOptions
      .filter((opt) => advAnswers[opt.id])
      .map((opt) => opt.label);

    const smokingLabel =
      SMOKING_OPTS.find((s) => s.id === smoking)?.label || "—";
    const durationLabel =
      DURATION_OPTS.find((d) => d.id === duration)?.label || "—";

    return {
      symptomsPlain,
      symptomsDetailed,
      advList,
      smokingLabel,
      durationLabel,
    };
  };

  /* ── Submit symptom (no-xray + hybrid) ── */
  const submitToBackend = async () => {
    setApiError("");
    setView("loading");
    try {
      const token = localStorage.getItem("token");
      // ✅ FIX: form input (`name`) now takes priority. We only fall back
      // to the /profile API's name if the patient left the form name blank.
      let patientName = name,
        patientEmail = "";
      try {
        const pr = await fetch("http://localhost:5001/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pr.ok) {
          const p = await pr.json();
          patientName = name || p.name; // form value wins
          patientEmail = p.email || "";
        }
      } catch {}

      const payload = {
        ...buildBackendPayload(
          coreSelected,
          severity,
          advAnswers,
          smoking,
          duration,
        ),
        name: patientName,
        email: patientEmail,
        age,
        gender,
      };
      const res = await fetch("http://localhost:5001/predict/symptom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || "Prediction failed. Please try again.");
        setView("form");
        return;
      }

      const now = new Date();
      const dateStr =
        now.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " · " +
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      const {
        symptomsPlain,
        symptomsDetailed,
        advList,
        smokingLabel,
        durationLabel,
      } = buildSymptomSummary();

      setPredictionResult({
        ...data,
        name: patientName,
        email: patientEmail,
        age,
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        date: dateStr,
        image: mode === "hybrid" ? xrayUrl : null,
        gradcam: mode === "hybrid" ? (data.gradcam ?? null) : null,
        // Patient's actual form inputs — always accurate, independent of
        // whatever the backend does or doesn't echo back.
        symptoms: symptomsPlain,
        symptomsDetailed,
        advSymptoms: advList,
        smokingHistory: smokingLabel,
        symptomDuration: durationLabel,
        decisionFactors: buildDecisionFactors(
          coreSelected,
          severity,
          advAnswers,
          smoking,
          duration,
        ),
      });
      clearSaved();
      setView("report");
    } catch {
      setApiError("Network error. Make sure the backend is running.");
      setView("form");
    }
  };

  /* ── Submit x-ray only — calls Densenet121 backend ── */
  const submitXrayOnly = async () => {
    setApiError("");
    setView("loading");
    try {
      const token = localStorage.getItem("token");

      // ✅ FIX: same priority fix as submitToBackend — form name wins.
      let patientName = name;
      let patientEmail = "";
      try {
        const pr = await fetch("http://localhost:5001/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pr.ok) {
          const p = await pr.json();
          patientName = name || p.name; // form value wins
          patientEmail = p.email || "";
        }
      } catch {}

      // Build FormData with the actual image file
      const formData = new FormData();
      if (xrayFile) {
        formData.append("image", xrayFile);
      } else {
        // Fallback: convert blob URL → file
        const response = await fetch(xrayUrl);
        const blob = await response.blob();
        formData.append("image", blob, "xray.jpg");
      }
      formData.append("patientName", patientName);

      const res = await fetch("http://localhost:5001/predict/xray", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setApiError(
          data.message || "X-ray prediction failed. Please try again.",
        );
        setView("form");
        return;
      }

      const now = new Date();
      const dateStr =
        now.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) +
        " · " +
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      setPredictionResult({
        ...data,
        name: patientName,
        email: patientEmail,
        age,
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        date: dateStr,
        image: xrayUrl,
        gradcam: data.gradcam ?? null,
        decisionFactors: [],
      });

      clearSaved();
      setView("report");
    } catch (err) {
      setApiError("Network error. Make sure the backend is running.");
      setView("form");
    }
  };

  const buildDecisionFactors = (
    coreSelected,
    severity,
    advAnswers,
    smoking,
    duration,
  ) => {
    const factors = [];
    const SEV_LABEL = {
      cough: "Cough",
      fever: "Fever",
      breathlessness: "Breathlessness",
      wheezing: "Wheezing",
      chest_pain: "Chest Pain",
      fatigue: "Fatigue",
    };
    const SEV_IMPACT = [
      "",
      "Mild Positive",
      "Moderate Positive",
      "Strong Positive",
    ];
    coreSelected.forEach((sid) => {
      const val = severity[sid] ?? 0;
      if (val > 0)
        factors.push({
          label: SEV_LABEL[sid] || sid,
          impact: SEV_IMPACT[val] || "Positive",
          type: "positive",
        });
    });
    if (advAnswers.smell_taste_loss)
      factors.push({
        label: "Smell/taste loss",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.muscle_aches)
      factors.push({
        label: "Muscle aches",
        impact: "Moderate Positive",
        type: "positive",
      });
    if (advAnswers.velcro_crackles)
      factors.push({
        label: "Velcro crackles",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.monthly_worsening)
      factors.push({
        label: "Monthly worsening",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.minutes_onset)
      factors.push({
        label: "Minutes-onset breathlessness",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.leg_swelling)
      factors.push({
        label: "Leg swelling (DVT)",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.drenching_sweats)
      factors.push({
        label: "Drenching night sweats",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.tb_exposure)
      factors.push({
        label: "TB exposure history",
        impact: "Moderate Positive",
        type: "positive",
      });
    if (advAnswers.chronic_cough_3w)
      factors.push({
        label: "Cough 3+ weeks",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.normal_between)
      factors.push({
        label: "Normal between attacks",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.inhaler_relief)
      factors.push({
        label: "Inhaler relief",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.specific_trigger)
      factors.push({
        label: "Specific trigger",
        impact: "Moderate Positive",
        type: "positive",
      });
    if (advAnswers.blood_in_cough)
      factors.push({
        label: "Haemoptysis",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.new_hoarseness)
      factors.push({
        label: "New hoarseness",
        impact: "Strong Positive",
        type: "positive",
      });
    if (advAnswers.cancer_wt_loss || advAnswers.unexplained_wt)
      factors.push({
        label: "Unintentional weight loss",
        impact: "Moderate Positive",
        type: "positive",
      });
    if (smoking === "heavy")
      factors.push({
        label: "Heavy smoker",
        impact: "High Risk",
        type: "positive",
      });
    else if (smoking === "regular")
      factors.push({
        label: "Regular smoker",
        impact: "High Risk",
        type: "positive",
      });
    else if (smoking === "non_smoker")
      factors.push({
        label: "Non-smoker",
        impact: "Protective Factor",
        type: "negative",
      });
    if (duration === "3_months")
      factors.push({
        label: "Symptoms 3+ months",
        impact: "Strong Positive",
        type: "positive",
      });
    else if (duration === "1_month")
      factors.push({
        label: "Symptoms ~1 month",
        impact: "Moderate Positive",
        type: "positive",
      });
    return factors.slice(0, 6);
  };

  const lightBg = {
    background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
  };
  const darkBg = {
    background:
      "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
  };

  const modeLabel =
    mode === "xray"
      ? "X-Ray Only"
      : mode === "hybrid"
        ? "Hybrid AI Mode"
        : "XGBoost Symptom Mode";
  const modeBadgeCls =
    mode === "hybrid"
      ? "bg-emerald-500/10 text-emerald-500"
      : mode === "xray"
        ? "bg-blue-500/10 text-blue-400"
        : "bg-amber-500/10 text-amber-500";
  const assessmentType =
    mode === "xray"
      ? "X-Ray Only"
      : mode === "hybrid"
        ? "Symptoms + X-Ray"
        : "Symptoms Only";

  /* ── REPORT VIEW ── */
  if (view === "report") {
    return (
      <>
        {predictionResult?.isEmergency && (
          <div className="bg-red-900/80 dark:bg-red-950/70 border-y border-red-500/50 p-4 mb-0 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-base">🚨</span>
            </div>
            <div>
              <p className="font-bold text-sm text-red-100 dark:text-red-400 uppercase tracking-widest mb-1">
                Medical Emergency
              </p>
              <p className="text-sm text-red-100 dark:text-red-200/80 leading-relaxed">
                These symptoms may indicate a life-threatening condition.{" "}
                <span className="font-semibold text-white dark:text-red-300">
                  Call an ambulance immediately. Do NOT drive yourself.
                </span>
              </p>
            </div>
          </div>
        )}
        {predictionResult?.warnings?.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-orange-800 font-semibold text-sm mb-2">
              ⚠️ Symptom Contradictions
            </p>
            {predictionResult.warnings.map((w, i) => (
              <p key={i} className="text-orange-700 text-xs mb-1">
                • {w}
              </p>
            ))}
          </div>
        )}
        <ReportDetails
          report={predictionResult}
          mode={mode}
          assessmentType={assessmentType}
          onBack={() => setView("form")}
          onNewAssessment={resetAll}
          onGoToXray={goToXray}
          onDashboard={() => setActiveView && setActiveView("dashboard")}
          patientData={{
            name,
            age,
            gender,
            coreSelected,
            severity,
            advAnswers,
            smoking,
            duration,
            hasXray,
            xrayUrl,
          }}
        />
      </>
    );
  }

  /* ── LOADING VIEW ── */
  if (view === "loading") {
    const loadingTitle =
      mode === "xray"
        ? "Analysing your X-ray..."
        : mode === "hybrid"
          ? "Running Hybrid AI analysis..."
          : "Analysing your symptoms...";
    const loadingSubtitle =
      mode === "xray"
        ? "Densenet121 is processing your radiograph"
        : mode === "hybrid"
          ? "Hybrid model is working in tandem"
          : "Symptom model is processing your inputs";
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
        style={isDark ? darkBg : lightBg}
      >
        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40 animate-pulse">
          <FiCpu size={36} className="text-white" />
        </div>
        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-bold ${gText}`}>{loadingTitle}</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {loadingSubtitle}
          </p>
        </div>
        <div className="w-64 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-cyan-600 to-blue-500"
            style={{ animation: "loadbar 1.8s ease-in-out infinite" }}
          />
        </div>
        <style>{`@keyframes loadbar { 0%{width:0%} 60%{width:80%} 100%{width:100%} }`}</style>
        <p className="text-[10px] text-slate-400/50 uppercase tracking-widest">
          MediScan AI · Please wait
        </p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     MODE SELECTION
  ══════════════════════════════════════════════════════════ */
  if (view === "mode-select") {
    return (
      <div
        className="min-h-screen p-4 md:p-8 font-sans selection:bg-cyan-500/30 transition-all duration-500 flex items-center justify-center"
        style={isDark ? darkBg : lightBg}
      >
        <style>{`
          @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
          .su{animation:slideUp .32s cubic-bezier(.4,0,.2,1) both}
        `}</style>
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-3 su">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/20">
                <FiCpu className="text-cyan-500 animate-pulse" size={13} />
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${gText}`}
                >
                  AI Engine Active
                </span>
              </div>
            </div>
            <h1 className={`text-3xl md:text-4xl font-semibold ${gText}`}>
              MediScan AI
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              AI-powered respiratory screening
            </p>
            <p className="text-base font-semibold text-slate-600 dark:text-slate-300 pt-2">
              How would you like to proceed?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1 — Without X-Ray */}
            <button
              type="button"
              onClick={() => selectMode("no-xray")}
              className="su group relative p-6 rounded-2xl border-2 text-left transition-all duration-300 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/40 dark:border-white/5 shadow-xl hover:border-amber-500/60 hover:shadow-amber-500/10 hover:shadow-2xl hover:-translate-y-1"
              style={{ animationDelay: "60ms" }}
            >
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FiHeart size={22} className="text-white" />
              </div>
              <h3 className="text-base font-black text-slate-700 dark:text-slate-200 mb-2">
                Without X-Ray
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Fill your symptoms. Based on your input Symptom model analyse
                and provides a diagnosis. No need to upload chest x-ray.
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                  Symptoms Analysis
                </span>
              </div>
            </button>

            {/* Card 2 — With X-Ray */}
            <button
              type="button"
              onClick={() => selectMode("xray")}
              className="su group relative p-6 rounded-2xl border-2 text-left transition-all duration-300 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/40 dark:border-white/5 shadow-xl hover:border-blue-500/60 hover:shadow-blue-500/10 hover:shadow-2xl hover:-translate-y-1"
              style={{ animationDelay: "120ms" }}
            >
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <FiUpload size={22} className="text-white" />
              </div>
              <h3 className="text-base font-black text-slate-700 dark:text-slate-200 mb-2">
                With X-Ray
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Upload your chest X-ray. X-ray model analyses the image and
                provides a diagnosis.
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  X-Ray Analysis
                </span>
              </div>
            </button>

            {/* Card 3 — Hybrid AI (Coming Soon — disabled, not clickable) */}
            <div
              className="su group relative p-6 rounded-2xl border-2 text-left transition-all duration-300 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/40 dark:border-white/5 shadow-xl opacity-60 cursor-not-allowed select-none"
              style={{ animationDelay: "180ms" }}
              aria-disabled="true"
            >
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-slate-500/10 dark:bg-slate-400/10 border border-slate-400/20 text-[9px] font-black uppercase tracking-widest text-slate-400">
                Coming Soon
              </div>
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center mb-4 shadow-lg">
                <FiZap size={22} className="text-white" />
              </div>
              <h3 className="text-base font-black text-slate-500 dark:text-slate-400 mb-2">
                Hybrid AI
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mb-3">
                Coming Soon
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Unavailable
                </span>
              </div>
            </div>
          </div>

          <div
            className="su flex items-start gap-2.5 p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/10"
            style={{ animationDelay: "240ms" }}
          >
            <FiInfo size={13} className="text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="font-bold text-cyan-500">Hybrid AI</span>{" "}
              (symptoms + X-ray) will give the highest diagnostic confidence and
              is coming soon. For now, choose{" "}
              <span className="font-bold text-amber-400">Without X-Ray</span>{" "}
              for a quick symptom-only screening, or{" "}
              <span className="font-bold text-blue-400">With X-Ray</span> for
              image-only analysis.
            </p>
          </div>

          <p className="text-center text-[10px] text-slate-400/50">
            MediScan AI · For clinical support only · Not a substitute for
            professional medical advice
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     FORM VIEW
  ══════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen p-4 md:p-8 font-sans selection:bg-cyan-500/30 transition-all duration-500"
      style={isDark ? darkBg : lightBg}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        input[type=range]{-webkit-appearance:none;appearance:none}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tooltipIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes bannerIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .su{animation:slideUp .32s cubic-bezier(.4,0,.2,1) both}
        .animate-tooltip{animation:tooltipIn .18s ease-out both}
        .animate-banner{animation:bannerIn .3s ease-out both}
      `}</style>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* RESTORE BANNER */}
        {showRestoreBanner && (
          <div className="animate-banner flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <FiShield size={14} className="text-cyan-400 shrink-0" />
              <p className="text-[11px] text-cyan-600 dark:text-cyan-300 font-semibold">
                Progress restored from your last session.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRestoreBanner(false)}
                className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors uppercase tracking-wide px-2 py-1"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-red-400 transition-colors uppercase tracking-wide px-2 py-1"
              >
                <FiTrash2 size={11} /> Reset
              </button>
            </div>
          </div>
        )}

        {/* API ERROR BANNER */}
        {apiError && (
          <div className="animate-banner flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <FiAlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-[11px] text-red-500 dark:text-red-400 font-semibold">
              {apiError}
            </p>
            <button
              onClick={() => setApiError("")}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => setView("mode-select")}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-cyan-500 transition-colors uppercase tracking-wide"
              >
                <FiChevronLeft size={12} /> Mode
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${modeBadgeCls}`}
              >
                {modeLabel}
              </span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-semibold ${gText}`}>
              Patient Diagnostics
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 tracking-wide">
              AI-powered respiratory screening · MediScan
            </p>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/20 self-start sm:self-auto">
            <FiCpu className="text-cyan-500 animate-pulse" size={13} />
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${gText}`}
            >
              AI Engine Active
            </span>
          </div>
        </header>

        {/* STEP BAR */}
        <div className={`${cardCls} p-4`}>
          <StepIndicator current={step} done={done} steps={STEPS} />
          <div className="mt-4 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{
                width: `${((step - 1) / Math.max(totalSteps - 1, 1)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-400">
              Step {step} of {totalSteps}
            </span>
            <span className={`text-[10px] font-bold ${gText}`}>
              {STEPS[step - 1]?.label}
            </span>
          </div>
        </div>

        {/* ══ STEP 1 — Patient Info (ALL modes) ══ */}
        {step === 1 && (
          <AnimatedSection dir={dir}>
            <div className={`${cardCls} overflow-hidden`}>
              <CardHeader title="1 · Patient Information" Icon={FiUser} />
              <div className="p-5 md:p-6 space-y-6">
                <div className="space-y-1.5 su">
                  <label
                    className={`text-[10px] font-black uppercase tracking-wider ${gText}`}
                  >
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div
                    className="space-y-1.5 su"
                    style={{ animationDelay: "60ms" }}
                  >
                    <label
                      className={`text-[10px] font-black uppercase tracking-wider ${gText}`}
                    >
                      Age <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="Age"
                      value={age}
                      onKeyDown={(e) =>
                        ["e", "-", "+"].includes(e.key) && e.preventDefault()
                      }
                      onChange={(e) =>
                        setAge(e.target.value < 0 ? "" : e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                  <div
                    className="space-y-1.5 su"
                    style={{ animationDelay: "110ms" }}
                  >
                    <label
                      className={`text-[10px] font-black uppercase tracking-wider ${gText}`}
                    >
                      Gender <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={selectCls}
                    >
                      <option value="" className="dark:bg-slate-900">
                        Select
                      </option>
                      <option value="male" className="dark:bg-slate-900">
                        Male
                      </option>
                      <option value="female" className="dark:bg-slate-900">
                        Female
                      </option>
                      <option value="other" className="dark:bg-slate-900">
                        Other
                      </option>
                    </select>
                  </div>
                </div>
                <div
                  className="su flex items-start gap-2.5 p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/10"
                  style={{ animationDelay: "160ms" }}
                >
                  <FiAlertCircle
                    size={13}
                    className="text-cyan-400 mt-0.5 shrink-0"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your data is used solely for diagnostic purposes and is not
                    stored on our servers.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* ══ STEP 2 — X-Ray Upload (xray-only mode) ══ */}
        {mode === "xray" && step === 2 && (
          <AnimatedSection dir={dir}>
            <div className="space-y-4">
              <div className={`${cardCls} overflow-hidden`}>
                <CardHeader title="2 · Chest X-Ray Upload" Icon={FiUpload} />
                <div className="p-5 md:p-6 space-y-5">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Upload your chest X-ray. Our model will analyse the image
                    and detect the condition.
                  </p>
                  <div className="relative h-52 group cursor-pointer">
                    {!xrayUrl ? (
                      <>
                        <input
                          type="file"
                          accept="image/*,.dcm"
                          className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setXrayUrl(URL.createObjectURL(f));
                              setXrayFile(f);
                            }
                          }}
                        />
                        <div className="h-full border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center transition-all group-hover:bg-violet-500/5 group-hover:border-violet-500/40">
                          <FiImage
                            size={36}
                            className="text-cyan-400 mb-3 group-hover:text-cyan-500 transition-colors"
                          />
                          <p
                            className={`text-[10px] font-black uppercase tracking-[0.2em] text-center px-6 ${gText}`}
                          >
                            Import Chest Radiograph
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1.5 uppercase tracking-widest">
                            DICOM · JPG · PNG supported
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="h-full relative rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group">
                        <img
                          src={xrayUrl}
                          className="w-full h-full object-cover"
                          alt="X-ray Preview"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setXrayUrl(null);
                            setXrayFile(null);
                          }}
                          className="absolute top-2.5 right-2.5 w-8 h-8 bg-red-500 text-white rounded-lg shadow-lg flex items-center justify-center hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <FiX size={14} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <FiCheckCircle
                              size={11}
                              className="text-green-400"
                            />
                            <p className="text-[9px] text-white/90 uppercase tracking-widest font-bold">
                              Radiograph ready
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info box about what the model detects */}
                  {!xrayUrl && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <FiAlertCircle
                        size={13}
                        className="text-amber-400 mt-0.5 shrink-0"
                      />
                      <p className="text-[11px] text-amber-500/80 dark:text-amber-400/70 leading-relaxed font-semibold">
                        X-ray upload is required to proceed with image-based
                        analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (xrayUrl) {
                    setDone((p) => [...new Set([...p, 2])]);
                    submitXrayOnly();
                  }
                }}
                disabled={!xrayUrl}
                className={[
                  "w-full py-4 rounded-xl px-5 text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-300 border border-white/20",
                  xrayUrl
                    ? "text-white bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98]"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed",
                ].join(" ")}
              >
                <FiCpu size={15} className={xrayUrl ? "animate-pulse" : ""} />
                Initiate AI Diagnosis
                <FiChevronRight size={15} />
              </button>
            </div>
          </AnimatedSection>
        )}

        {/* ══ STEP 2 — Core Symptoms (no-xray & hybrid) ══ */}
        {(mode === "no-xray" || mode === "hybrid") && step === 2 && (
          <AnimatedSection dir={dir}>
            <div className={`${cardCls} overflow-hidden`}>
              <CardHeader title="2 · Core Symptoms" Icon={FiHeart} />
              <div className="p-5 md:p-6 space-y-4">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Select all symptoms you are currently experiencing. Tap to
                  select, then drag the slider to rate severity.
                </p>
                <div className="space-y-3">
                  {CORE_SYMPTOMS.map((s, i) => {
                    const active = coreSelected.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        className="su"
                        style={{ animationDelay: `${i * 55}ms` }}
                      >
                        <div
                          className={[
                            "rounded-xl border transition-all duration-300 overflow-hidden",
                            active
                              ? "border-cyan-500/40 bg-cyan-500/5 dark:bg-cyan-900/10"
                              : "border-slate-200 dark:border-slate-700/60 bg-white/30 dark:bg-slate-900/20",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCore(s.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <span
                              className={`text-sm font-semibold transition-colors ${active ? "text-cyan-700 dark:text-cyan-300" : "text-slate-600 dark:text-slate-300"}`}
                            >
                              {s.label}
                            </span>
                            <div
                              className={[
                                "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0",
                                active
                                  ? "bg-linear-to-br from-cyan-600 to-blue-500 border-cyan-500"
                                  : "border-slate-300 dark:border-slate-600",
                              ].join(" ")}
                            >
                              {active && (
                                <FiCheckCircle
                                  size={11}
                                  className="text-white"
                                />
                              )}
                            </div>
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-400 ${active ? "max-h-40 px-4 pb-4" : "max-h-0"}`}
                          >
                            <div className="border-t border-cyan-200 dark:border-cyan-900/30 pt-3">
                              <SeveritySlider
                                symptomId={s.id}
                                value={severity[s.id] ?? 1}
                                onChange={(v) =>
                                  setSeverity((p) => ({ ...p, [s.id]: v }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {coreSelected.length === 0 && (
                  <p className="text-[10px] text-center text-amber-500/80 font-semibold pt-1">
                    ⚠ Select at least one symptom to continue
                  </p>
                )}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* ══ STEP 3 — AI Follow-ups (no-xray & hybrid) ══ */}
        {(mode === "no-xray" || mode === "hybrid") && step === 3 && (
          <AnimatedSection dir={dir}>
            <div className={`${cardCls} overflow-hidden`}>
              <CardHeader title="3 · AI Follow-up Questions" Icon={FiZap} />
              <div className="p-5 md:p-6 space-y-4">
                {advOptions.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <FiZap className="text-cyan-400" size={24} />
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs">
                      No targeted follow-ups needed. You can proceed.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      AI-generated targeted questions based on your symptoms.
                    </p>
                    <div className="space-y-2.5">
                      {advOptions.map((opt, i) => {
                        const active = !!advAnswers[opt.id];
                        return (
                          <div
                            key={opt.id}
                            className={[
                              "su rounded-xl border transition-all duration-300",
                              active
                                ? "bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 border-cyan-600 shadow-md shadow-cyan-500/20"
                                : "bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 hover:border-cyan-400/50",
                            ].join(" ")}
                            style={{ animationDelay: `${i * 60}ms` }}
                          >
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => toggleAdv(opt.id)}
                                className="flex-1 text-left px-4 py-3.5 flex items-center gap-3"
                              >
                                <div
                                  className={[
                                    "w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-all",
                                    active
                                      ? "bg-white/20 border-white/40"
                                      : "border-slate-300 dark:border-slate-600",
                                  ].join(" ")}
                                >
                                  {active && (
                                    <FiCheckCircle
                                      size={11}
                                      className="text-white"
                                    />
                                  )}
                                </div>
                                <span
                                  className={`text-sm font-medium leading-snug ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}
                                >
                                  {opt.label}
                                </span>
                              </button>
                              {opt.tooltip && (
                                <div
                                  className={`pr-3.5 ${active ? "text-white/70" : ""}`}
                                >
                                  <Tooltip text={opt.tooltip} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* ══ STEP 4 — Smoking History (no-xray & hybrid) ══ */}
        {(mode === "no-xray" || mode === "hybrid") && step === 4 && (
          <AnimatedSection dir={dir}>
            <div className={`${cardCls} overflow-hidden`}>
              <CardHeader title="4 · Smoking History" Icon={FiActivity} />
              <div className="p-5 md:p-6 space-y-3">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mb-2">
                  Smoking history is a critical factor in respiratory disease
                  diagnosis.
                </p>
                {SMOKING_OPTS.map((opt, i) => {
                  const active = smoking === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSmoking(opt.id)}
                      className={[
                        "su w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between",
                        active
                          ? "bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 border-cyan-600 shadow-md shadow-cyan-500/20"
                          : "bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 hover:border-cyan-400/50",
                      ].join(" ")}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div>
                        <p
                          className={`text-sm font-bold ${active ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          {opt.label}
                        </p>
                        <p
                          className={`text-[10px] mt-0.5 ${active ? "text-white/70" : "text-slate-400"}`}
                        >
                          {opt.desc}
                        </p>
                      </div>
                      {active && (
                        <FiCheckCircle
                          size={16}
                          className="text-white shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* ══ STEP 5 — Duration (no-xray & hybrid) ══ */}
        {(mode === "no-xray" || mode === "hybrid") && step === 5 && (
          <AnimatedSection dir={dir}>
            <div className={`${cardCls} overflow-hidden`}>
              <CardHeader title="5 · Symptom Duration" Icon={FiClock} />
              <div className="p-5 md:p-6 space-y-4">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Duration is critical for separating acute infections from
                  chronic conditions like TB, COPD, and bronchitis.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {DURATION_OPTS.map((opt, i) => {
                    const active = duration === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDuration(opt.id)}
                        className={[
                          "su py-6 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2",
                          active
                            ? "bg-linear-to-br from-cyan-600 via-blue-500 to-cyan-800 border-cyan-600 shadow-lg shadow-cyan-500/20"
                            : "bg-white/40 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 hover:border-cyan-400/50",
                        ].join(" ")}
                        style={{ animationDelay: `${i * 70}ms` }}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span
                          className={`text-xs font-bold ${active ? "text-white" : "text-slate-600 dark:text-slate-300"}`}
                        >
                          {opt.label}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wide ${active ? "text-white/70" : "text-slate-400"}`}
                        >
                          {opt.hint}
                        </span>
                        {active && (
                          <FiCheckCircle size={13} className="text-white/80" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit — no-xray mode only */}
            {mode === "no-xray" && (
              <div className="mt-4 space-y-3 su">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-400/15">
                  <FiAlertCircle
                    size={13}
                    className="text-amber-400 mt-0.5 shrink-0"
                  />
                  <p className="text-[11px] text-amber-500/80 dark:text-amber-400/70 leading-relaxed">
                    Model will analyse your symptoms and predict the most likely
                    respiratory condition.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (duration) {
                      setDone((p) => [...new Set([...p, 5])]);
                      submitToBackend();
                    }
                  }}
                  disabled={!duration}
                  className={[
                    "w-full py-4 rounded-xl px-5 text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-300 border border-white/20",
                    duration
                      ? "text-white bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98]"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed",
                  ].join(" ")}
                >
                  <FiCpu
                    size={15}
                    className={duration ? "animate-pulse" : ""}
                  />
                  Initiate AI Diagnosis
                  <FiChevronRight size={15} />
                </button>
              </div>
            )}
          </AnimatedSection>
        )}

        {/* ══ STEP 6 — X-Ray Upload (hybrid mode only) ══ */}
        {mode === "hybrid" && step === 6 && (
          <AnimatedSection dir={dir}>
            <div className="space-y-4">
              <div className={`${cardCls} overflow-hidden`}>
                <CardHeader title="6 · Chest X-Ray Upload" Icon={FiUpload} />
                <div className="p-5 md:p-6 space-y-5">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Upload your chest X-ray for Hybrid AI analysis (symptoms +
                    image).
                  </p>
                  <div className="relative h-52 group cursor-pointer">
                    {!xrayUrl ? (
                      <>
                        <input
                          type="file"
                          accept="image/*,.dcm"
                          className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setXrayUrl(URL.createObjectURL(f));
                              setXrayFile(f);
                            }
                          }}
                        />
                        <div className="h-full border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center transition-all group-hover:bg-cyan-500/5 group-hover:border-cyan-500/40">
                          <FiImage
                            size={36}
                            className="text-cyan-400 mb-3 group-hover:text-cyan-500 transition-colors"
                          />
                          <p
                            className={`text-[10px] font-black uppercase tracking-[0.2em] text-center px-6 ${gText}`}
                          >
                            Import Chest Radiograph
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1.5 uppercase tracking-widest">
                            DICOM · JPG · PNG supported
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="h-full relative rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group">
                        <img
                          src={xrayUrl}
                          className="w-full h-full object-cover"
                          alt="X-ray Preview"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setXrayUrl(null);
                            setXrayFile(null);
                          }}
                          className="absolute top-2.5 right-2.5 w-8 h-8 bg-red-500 text-white rounded-lg shadow-lg flex items-center justify-center hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <FiX size={14} />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <FiCheckCircle
                              size={11}
                              className="text-green-400"
                            />
                            <p className="text-[9px] text-white/90 uppercase tracking-widest font-bold">
                              Radiograph ready
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {!xrayUrl && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                      <FiAlertCircle
                        size={13}
                        className="text-red-400 mt-0.5 shrink-0"
                      />
                      <p className="text-[11px] text-red-500/80 dark:text-red-400/70 leading-relaxed font-semibold">
                        X-ray upload is <strong>mandatory</strong> for Hybrid AI
                        analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (xrayUrl) {
                    setDone((p) => [...new Set([...p, 6])]);
                    submitToBackend();
                  }
                }}
                disabled={!xrayUrl}
                className={[
                  "w-full py-4 rounded-xl px-5 text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-300 border border-white/20",
                  xrayUrl
                    ? "text-white bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98]"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60 border-transparent",
                ].join(" ")}
              >
                <FiCpu size={15} className={xrayUrl ? "animate-pulse" : ""} />
                Initiate AI Diagnosis
                <FiChevronRight size={15} />
              </button>
            </div>
          </AnimatedSection>
        )}

        {/* ══ NAV BUTTONS ══ */}
        {!isSubmitStep && (
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-white/30 dark:bg-slate-900/20 hover:border-violet-400/50 transition-all"
              >
                <FiChevronLeft size={14} /> Back
              </button>
            )}
            {step < totalSteps && (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed()}
                className={[
                  "flex-1 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300",
                  canProceed()
                    ? "bg-linear-to-r from-cyan-500 via-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/30 hover:brightness-110 hover:-translate-y-0.5"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed",
                ].join(" ")}
              >
                Next <FiChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {isSubmitStep && step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-white/30 dark:bg-slate-900/20 hover:border-violet-400/50 transition-all"
          >
            <FiChevronLeft size={14} /> Back
          </button>
        )}

        <p className="text-center text-[10px] text-slate-400/50 pb-4">
          MediScan AI · For clinical support only · Not a substitute for
          professional medical advice
        </p>
      </div>
    </div>
  );
}