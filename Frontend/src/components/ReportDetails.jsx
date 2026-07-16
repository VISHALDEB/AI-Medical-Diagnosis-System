import React, { useState, useEffect, useRef } from "react";
import {
  FiArrowLeft,
  FiDownload,
  FiUser,
  FiCalendar,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiFileText,
  FiWind,
  FiThermometer,
  FiHeart,
  FiShield,
  FiCpu,
  FiRefreshCw,
  FiUpload,
  FiUserCheck,
  FiChevronRight,
  FiBarChart2,
  FiList,
  FiInfo,
  FiStar,
  FiPlusCircle,
  FiX,
  FiZap,
  FiMaximize2,
  FiGrid,
} from "react-icons/fi";
import { generateMediScanPDF } from "./pdfReportGenerator";

/* ═══════════════════════════════════════════════════════════════
   STYLE TOKENS
═══════════════════════════════════════════════════════════════ */
const gText = [
  "bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-800 bg-clip-text text-transparent",
  "dark:from-gray-200 dark:via-white dark:to-gray-400",
  "dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)] tracking-tight",
].join(" ");

const cardCls = [
  "bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl",
  "border border-white/40 dark:border-white/5 rounded-2xl shadow-xl",
].join(" ");

const cardHeaderCls = [
  "px-5 py-3.5 border-b border-white/30 dark:border-white/5",
  "flex items-center justify-between bg-white/30 dark:bg-slate-900/30",
].join(" ");

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const getRiskColor = (risk) => {
  const r = (risk || "").toLowerCase();
  if (r === "low")
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      bar: "#10b981",
    };
  if (r === "high")
    return {
      text: "text-red-500 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      bar: "#ef4444",
    };
  if (r === "critical")
    return {
      text: "text-red-600 dark:text-red-300",
      bg: "bg-red-600/10",
      border: "border-red-600/25",
      bar: "#dc2626",
    };
  return {
    text: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    bar: "#f59e0b",
  };
};

const getConfColor = (conf) => {
  const n = parseFloat((conf || "0").replace("%", ""));
  if (n >= 85)
    return { text: "text-emerald-600 dark:text-emerald-400", bar: "#10b981" };
  if (n >= 65)
    return { text: "text-amber-500 dark:text-amber-400", bar: "#f59e0b" };
  return { text: "text-red-500 dark:text-red-400", bar: "#ef4444" };
};

const getDiagColor = (result) => {
  const r = (result || "").toLowerCase();
  if (r === "normal")
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    };
  if (
    [
      "pneumonia",
      "tuberculosis",
      "covid",
      "lung cancer",
      "pneumothorax",
      "effusion",
    ].some((d) => r.includes(d))
  )
    return {
      text: "text-red-500 dark:text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    };
  return {
    text: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  };
};

const SYMPTOM_ICONS = {
  Cough: <FiWind size={11} />,
  Fever: <FiThermometer size={11} />,
  "Chest Pain": <FiHeart size={11} />,
  Breathlessness: <FiActivity size={11} />,
  Wheezing: <FiWind size={11} />,
  Fatigue: <FiAlertCircle size={11} />,
};

/* ── Animated progress bar ── */
function Bar({ pct, color, height = "h-1.5" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = "0%";
    const t = setTimeout(() => {
      el.style.width = pct;
    }, 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div
      className={`w-full ${height} bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden`}
    >
      <div
        ref={ref}
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ background: color, width: "0%" }}
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }) {
  return (
    <div className={cardHeaderCls}>
      <div className="flex items-center gap-2.5">
        <Icon className="text-cyan-500" size={15} />
        <span
          className={`text-[11px] font-black uppercase tracking-widest ${gText}`}
        >
          {title}
        </span>
      </div>
      {badge}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DECISION FACTORS — derived from probabilities + symptoms + risk
   (since backend doesn't store these, we build them client-side)
═══════════════════════════════════════════════════════════════ */
function buildDecisionFactors(report) {
  const factors = [];
  const result = report.result || "";
  const risk = (report.risk || "").toLowerCase();
  const probs = report.probabilities || [];
  const symptoms = report.symptoms || [];
  const adv = report.advSymptoms || [];

  // Top disease probability → strongest positive factor
  if (probs.length > 0) {
    factors.push({
      label: `${probs[0].disease} — ${probs[0].pct}% probability`,
      impact:
        probs[0].pct >= 85
          ? "Strong Positive"
          : probs[0].pct >= 65
            ? "Moderate Positive"
            : "Mild Positive",
      type: "positive",
    });
  }

  // Risk level factor
  if (risk === "critical" || risk === "high") {
    factors.push({
      label: `${report.risk} risk level detected`,
      impact: "High Risk",
      type: "positive",
    });
  } else if (risk === "moderate") {
    factors.push({
      label: "Moderate risk level",
      impact: "Moderate Positive",
      type: "positive",
    });
  }

  // Key symptoms from advSymptoms
  const highRiskAdv = [
    "blood_in_cough",
    "Blood In Cough",
    "Coughing Blood",
    "coughing blood",
    "leg_swelling",
    "Leg Swelling",
    "immobility_risk",
    "minutes_onset",
    "drenching_sweats",
    "Drenching Sweats",
    "velcro_crackles",
  ];
  adv.forEach((s) => {
    if (highRiskAdv.some((h) => s.toLowerCase().includes(h.toLowerCase()))) {
      factors.push({ label: s, impact: "Strong Positive", type: "positive" });
    }
  });

  // Regular symptoms
  symptoms.slice(0, 3).forEach((s) => {
    factors.push({ label: s, impact: "Moderate Positive", type: "positive" });
  });

  // 2nd probability as partial protective / competing disease
  if (probs.length > 1 && probs[1].pct > 0) {
    factors.push({
      label: `${probs[1].disease} — ${probs[1].pct}% (alternate)`,
      impact: "Moderate Negative",
      type: "negative",
    });
  }

  // Normal result = major protective factor
  if (result === "Normal") {
    factors.unshift({
      label: "No abnormality detected",
      impact: "Very Strong Negative",
      type: "negative",
    });
  }

  return factors.slice(0, 6);
}

/* ═══════════════════════════════════════════════════════════════
   X-RAY INTERPRETATION — generated from result + confidence
═══════════════════════════════════════════════════════════════ */
function buildXrayInterpretation(report) {
  if (report.xrayInterpretation) return report.xrayInterpretation;

  const r = (report.result || "").toLowerCase();
  const pct = report.confidence || "";

  const MAP = {
    normal:
      "No significant opacity, consolidation, or pathological patterns detected. Lung fields appear clear.",
    pneumonia: `AI detected opacity and consolidation patterns in the lung fields consistent with bacterial or viral pneumonia (${pct} confidence).`,
    tuberculosis: `Upper lobe infiltrates and possible cavitation patterns detected, consistent with pulmonary tuberculosis (${pct} confidence).`,
    "lung cancer": `Irregular mass or nodular opacity detected. Further imaging (CT/PET) is strongly recommended (${pct} confidence).`,
    "covid-19": `Bilateral ground-glass opacities detected, a pattern commonly associated with COVID-19 pneumonitis (${pct} confidence).`,
    fibrosis: `Diffuse reticular pattern and bilateral honeycombing detected, consistent with pulmonary fibrosis (${pct} confidence).`,
    effusion: `Blunting of costophrenic angle detected, suggesting the presence of pleural effusion (${pct} confidence).`,
    emphysema: `Hyperinflation and flattened diaphragm detected, consistent with emphysematous changes (${pct} confidence).`,
    atelectasis: `Increased opacity with volume loss detected, consistent with atelectasis (${pct} confidence).`,
    pneumothorax: `Absence of lung markings on one side detected, consistent with pneumothorax (${pct} confidence). Seek emergency care.`,
  };

  for (const [key, val] of Object.entries(MAP)) {
    if (r.includes(key)) return val;
  }
  return `AI analysis complete. ${report.result} detected with ${pct} confidence. Consult a pulmonologist for detailed interpretation.`;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ReportDetails({
  report: reportProp,
  mode,
  assessmentType,
  onBack,
  onNewAssessment,
  onGoToXray,
  onDashboard,
}) {
  /* ── Dark mode detection ── */
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

  /* ── If no report prop passed, try to load from backend ── */
  const [report, setReport] = useState(reportProp || null);
  const [loadingReport, setLoadingReport] = useState(!reportProp);

  useEffect(() => {
    if (reportProp) {
      setReport(reportProp);
      setLoadingReport(false);
      return;
    }
    // Try loading latest report from /reports
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingReport(false);
      return;
    }
    fetch("http://localhost:5001/reports", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReport(data[data.length - 1]); // latest
        }
        setLoadingReport(false);
      })
      .catch(() => setLoadingReport(false));
  }, [reportProp]);

  const [imgExpanded, setImgExpanded] = useState(false);
  const [expandedImg, setExpandedImg] = useState(null);

  /* ── Loading state ── */
  const lightBg = {
    background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
  };
  const darkBg = {
    background:
      "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
  };

  if (loadingReport) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={isDark ? darkBg : lightBg}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">
            Loading report…
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={isDark ? darkBg : lightBg}
      >
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FiFileText size={24} className="text-cyan-500" />
          </div>
          <p className="text-slate-400 text-sm">No report found.</p>
          <button
            onClick={onNewAssessment || onBack}
            className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white
              bg-linear-to-r from-cyan-600 to-indigo-700 border border-white/20
              hover:brightness-110 transition-all"
          >
            Run a New Assessment
          </button>
        </div>
      </div>
    );
  }

  /* ── Derived values ── */
  const withXray =
    mode === "xray" ||
    mode === "hybrid" ||
    (report.assessmentType || "").toLowerCase().includes("x-ray") ||
    (report.assessmentType || "").toLowerCase().includes("xray") ||
    (report.aiMode || "").toLowerCase().includes("densenet");

  const displayAssessmentType =
    assessmentType ||
    report.assessmentType ||
    (withXray ? "X-Ray Analysis" : "Symptoms Only");

  const risk = getRiskColor(report.risk);
  const conf = getConfColor(report.confidence);
  const diag = getDiagColor(report.result);
  const confN = parseFloat((report.confidence || "0").replace("%", ""));

  // Patient info — from report or localStorage
  const patientName =
    report.patientName || report.name || localStorage.getItem("userName") || "Patient";
  const patientAge = report.age || "—";
  const patientGender = report.gender || "—";

  // Derived fields
  const decisionFactors = buildDecisionFactors(report);
  const xrayInterpretation = buildXrayInterpretation(report);

  /* ── PDF Download (shared, theme-matched generator) ── */
  const handleDownload = async () => {
    try {
      await generateMediScanPDF(
        { ...report, assessmentType: displayAssessmentType },
        { patientNameOverride: patientName },
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    }
  };

  const openImg = (src) => {
    if (src) {
      setExpandedImg(src);
      setImgExpanded(true);
    }
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen w-full font-sans selection:bg-cyan-500/30 transition-all duration-500"
      style={isDark ? darkBg : lightBg}
    >
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes pulseRing{ 0%,100%{opacity:1} 50%{opacity:.4} }
        .su       { animation:slideUp 0.38s cubic-bezier(.4,0,.2,1) both; }
        .fi       { animation:fadeIn  0.4s ease both; }
        .pulse-dot{ animation:pulseRing 2s infinite; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      <div className="w-full px-4 md:px-8 py-6 md:py-8 space-y-5">
        {/* ════════════════════════════════════════
            SECTION 1 — HEADER
        ════════════════════════════════════════ */}
        <div className="su">
          <div className="flex flex-col gap-3">
            {/* Row 1: Back + action buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onDashboard || onBack}
                className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0
                  border border-slate-200 dark:border-slate-700
                  bg-white/30 dark:bg-slate-900/20 backdrop-blur-md
                  text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider
                  hover:border-cyan-400/50 hover:text-cyan-500 transition-all"
              >
                <FiArrowLeft size={13} />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider
                    text-white bg-linear-to-r from-emerald-500 via-emerald-600 to-teal-600
                    border border-white/20 shadow-[0_6px_18px_-4px_rgba(16,185,129,0.45)]
                    hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
                >
                  <FiDownload size={14} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={onNewAssessment}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider
                    text-white bg-linear-to-br from-cyan-600 via-cyan-500 to-indigo-700
                    border border-white/20 shadow-[0_6px_18px_-4px_rgba(139,92,246,0.45)]
                    hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
                >
                  <FiPlusCircle size={14} />
                  <span className="hidden sm:inline">New Assessment</span>
                </button>
              </div>
            </div>

            {/* Row 2: Title + badge */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className={`text-2xl md:text-3xl font-semibold ${gText}`}>
                  Diagnosis Results
                </h1>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <FiCheckCircle size={10} className="pulse-dot" />
                  AI Analysis Complete
                </span>
                {/* Emergency badge */}
                {report.isEmergency && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400">
                    <FiAlertTriangle size={10} className="pulse-dot" />
                    Emergency
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                Our AI model has analyzed your{" "}
                {withXray ? "X-ray and symptoms" : "symptoms"} to generate the
                diagnosis below.
              </p>
            </div>
          </div>
        </div>

        {/* ── PATIENT SUMMARY STRIP ── */}
        <div
          className={`su ${cardCls} px-5 py-4`}
          style={{ animationDelay: "50ms" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: FiUser, label: "Patient Name", value: patientName },
              {
                icon: FiActivity,
                label: "Scan ID",
                value: report.id ? `#${report.id}` : "—",
              },
              {
                icon: FiShield,
                label: "Assessment Type",
                value: displayAssessmentType,
              },
              {
                icon: FiCalendar,
                label: "Date",
                value: report.date || "—",
                wrap: true,
              },
              {
                icon: FiCpu,
                label: "AI Engine",
                value: report.aiMode?.includes("DenseNet")
                  ? "DenseNet121"
                  : report.aiMode?.includes("XGBoost")
                    ? "XGBoost"
                    : report.aiMode || "—",
              },
            ].map(({ icon: Icon, label, value, wrap }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0">
                  <Icon size={12} className="text-cyan-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                    {label}
                  </p>
                  <p
                    className={`font-semibold text-slate-700 dark:text-slate-200 mt-0.5 ${wrap ? "text-[10px] leading-tight" : "text-xs truncate"}`}
                  >
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════
            ROW A — Primary Diagnosis + AI Decision Breakdown
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* SECTION 2 — Primary Diagnosis */}
          <div
            className={`su lg:col-span-5 ${cardCls} overflow-hidden`}
            style={{ animationDelay: "100ms" }}
          >
            <SectionHeader icon={FiTrendingUp} title="Primary Diagnosis" />
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${diag.bg} border ${diag.border}`}
                  >
                    <span className="text-2xl">🫁</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      Detected Condition
                    </p>
                    <h2 className={`text-2xl font-black ${diag.text}`}>
                      {report.result || "Unknown"}
                    </h2>
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shrink-0 ${risk.bg} ${risk.border} ${risk.text}`}
                >
                  {report.risk || "—"} Risk
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {report.result === "Normal"
                  ? "No signs of respiratory abnormality detected. Maintain a healthy lifestyle."
                  : `AI model detected clinical indicators consistent with ${report.result}. Immediate medical consultation is recommended.`}
              </p>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Confidence Score
                  </span>
                  <span className={`text-sm font-black ${conf.text}`}>
                    {report.confidence}
                  </span>
                </div>
                <Bar pct={`${confN}%`} color={conf.bar} height="h-2" />
                <div className="flex justify-between">
                  {["0%", "25%", "50%", "75%", "100%"].map((l) => (
                    <span
                      key={l}
                      className="text-[9px] text-slate-400/60 font-semibold"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  {
                    label: "Confidence",
                    value: report.confidence || "—",
                    color: conf.text,
                  },
                  {
                    label: "Reliability",
                    value: report.reliability || "—",
                    color:
                      report.reliability === "High"
                        ? "text-emerald-500 dark:text-emerald-400"
                        : report.reliability === "Low"
                          ? "text-red-500 dark:text-red-400"
                          : "text-amber-500",
                  },
                  {
                    label: "AI Mode",
                    value: report.aiMode?.includes("DenseNet")
                      ? "X-Ray"
                      : report.aiMode?.includes("XGBoost")
                        ? "Symptom"
                        : "Hybrid",
                    color: "text-cyan-500 dark:text-cyan-400",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/30 dark:bg-slate-800/30 border border-white/30 dark:border-white/5 p-2.5 text-center space-y-1"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p
                      className={`text-[11px] font-black leading-tight ${color}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3 — AI Decision Breakdown */}
          <div
            className={`su lg:col-span-7 ${cardCls} overflow-hidden`}
            style={{ animationDelay: "140ms" }}
          >
            <SectionHeader
              icon={FiZap}
              title="AI Decision Breakdown"
              badge={
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase tracking-widest text-cyan-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 pulse-dot" />
                  Explainable AI
                </span>
              }
            />
            <div className="p-5 space-y-3">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Top contributing factors.{" "}
                <span className="text-red-400 font-semibold">Red</span> = risk
                factor ·{" "}
                <span className="text-emerald-500 font-semibold">Green</span> =
                protective sign.
              </p>
              <div className="space-y-2.5">
                {decisionFactors.map((f, i) => {
                  const isPos = f.type === "positive";
                  const barColor = isPos ? "#ef4444" : "#10b981";
                  const barW = isPos
                    ? f.impact.startsWith("Strong")
                      ? "85%"
                      : f.impact.startsWith("High")
                        ? "70%"
                        : "50%"
                    : f.impact.startsWith("Very")
                      ? "90%"
                      : f.impact.startsWith("Strong")
                        ? "75%"
                        : "45%";
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPos ? "bg-red-400" : "bg-emerald-400"}`}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-300 w-40 md:w-48 shrink-0 truncate">
                        {f.label}
                      </span>
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: barW, background: barColor }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-bold shrink-0 text-right w-28 md:w-36 ${isPos ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {f.impact}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-400/60 pt-1">
                ● Positive = increases disease risk &nbsp;·&nbsp; ● Negative =
                reduces risk / good sign
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            ROW B — Disease Probability + X-Ray (if applicable) + Recommendations
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* SECTION 4 — Disease Probability */}
          <div
            className={`su ${cardCls} overflow-hidden ${withXray ? "lg:col-span-3" : "lg:col-span-4"}`}
            style={{ animationDelay: "180ms" }}
          >
            <SectionHeader icon={FiBarChart2} title="Disease Probability" />
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                All disease probabilities based on analysed inputs.
              </p>
              <div className="space-y-3.5">
                {(report.probabilities || []).map((d, i) => {
                  const color =
                    i === 0
                      ? "#ef4444"
                      : i === 1
                        ? "#f97316"
                        : i === 2
                          ? "#f59e0b"
                          : "#94a3b8";
                  return (
                    <div key={d.disease} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {d.disease}
                        </span>
                        <span className="text-xs font-black" style={{ color }}>
                          {d.pct}%
                        </span>
                      </div>
                      <Bar pct={`${d.pct}%`} color={color} />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <FiInfo size={12} className="text-cyan-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  These probabilities represent the AI's likelihood estimate for
                  each condition.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5 — X-Ray Analysis (only if withXray) */}
          {withXray && (
            <div
              className={`su lg:col-span-5 ${cardCls} overflow-hidden`}
              style={{ animationDelay: "220ms" }}
            >
              <SectionHeader icon={FiUpload} title="X-Ray Analysis" />
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* X-Ray Image */}
                  <div className="space-y-2">
                    <div className="px-2.5 py-1 rounded-lg bg-linear-to-r from-cyan-600 to-cyan-600 text-white text-[10px] font-bold uppercase tracking-widest inline-block">
                      X-Ray Image
                    </div>
                    <div
                      className="relative h-40 md:h-48 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/10 cursor-pointer group bg-slate-900/10 dark:bg-slate-900/40"
                      onClick={() => openImg(report.originalXray)}
                    >
                      {report.originalXray ? (
                        <>
                          <img
                            src={report.originalXray}
                            className="w-full h-full object-contain"
                            alt="Chest X-Ray"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <FiMaximize2 className="text-white" size={20} />
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-2 p-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                            <FiFileText size={16} className="text-cyan-400" />
                          </div>
                          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                            No X-ray in history
                          </p>
                          <p className="text-[9px] text-slate-400/50 uppercase tracking-wider text-center">
                            Upload fresh scan
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grad-CAM Heatmap */}
                  <div className="space-y-2">
                    <div className="px-2.5 py-1 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] font-bold uppercase tracking-widest inline-block">
                      HEAT-MAP
                    </div>
                    <div
                      className="relative h-40 md:h-48 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-white/10 cursor-pointer group bg-slate-900/10 dark:bg-slate-900/40"
                      onClick={() => openImg(report.gradcam)}
                    >
                      {report.gradcam ? (
                        <>
                          <img
                            src={report.gradcam}
                            className="w-full h-full object-contain"
                            alt="Grad-CAM Heatmap"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <FiMaximize2 className="text-white" size={20} />
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-2 p-3">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                            <FiFileText size={16} className="text-cyan-400" />
                          </div>
                          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                            {report.id
                              ? "Heatmap not stored in history"
                              : "Heatmap not available"}
                          </p>
                          <p className="text-[9px] text-slate-400/50 uppercase tracking-wider text-center">
                            {report.id
                              ? "Run new scan to see"
                              : "Requires X-ray"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interpretation */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/30 dark:bg-slate-800/20 border border-white/30 dark:border-white/5">
                  <FiCheckCircle
                    size={13}
                    className="text-emerald-400 mt-0.5 shrink-0"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {xrayInterpretation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6 — Recommendations */}
          <div
            className={`su ${cardCls} overflow-hidden ${withXray ? "lg:col-span-4" : "lg:col-span-8"}`}
            style={{ animationDelay: "260ms" }}
          >
            <SectionHeader icon={FiStar} title="Recommendations" />
            <div
              className={`p-5 space-y-2.5 ${!withXray ? "md:grid md:grid-cols-2 md:gap-3 md:space-y-0" : ""}`}
            >
              <p
                className={`text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mb-1 ${!withXray ? "md:col-span-2" : ""}`}
              >
                Actionable clinical guidance based on the AI diagnosis.
              </p>
              {(report.recommendations || []).map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/30 dark:bg-slate-800/20 border border-white/30 dark:border-white/5"
                >
                  <FiCheckCircle
                    size={13}
                    className="text-cyan-500 mt-0.5 shrink-0"
                  />
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rec}
                  </p>
                </div>
              ))}
              <div
                className={`flex items-start gap-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/15 ${!withXray ? "md:col-span-2" : ""}`}
              >
                <FiAlertTriangle
                  size={13}
                  className="text-red-400 mt-0.5 shrink-0"
                />
                <p className="text-[11px] text-red-500/80 dark:text-red-400/70 leading-relaxed font-semibold">
                  Consult a physician and follow the recommended treatment
                  promptly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            ROW C — Symptoms + Reliability + Next Steps + About
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* SECTION 7 — Submitted Symptoms */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "300ms" }}
          >
            <SectionHeader icon={FiList} title="Submitted Symptoms" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Total Reported
                </span>
                <span className={`text-sm font-black ${gText}`}>
                  {(report.symptoms || []).length}
                </span>
              </div>

              {/* Primary symptoms */}
              <div className="flex flex-wrap gap-2">
                {(report.symptoms || []).length > 0 ? (
                  report.symptoms.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/8 border border-cyan-500/15 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300"
                    >
                      {SYMPTOM_ICONS[s] || <FiActivity size={10} />} {s}
                    </span>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No symptoms recorded.
                  </p>
                )}
              </div>

              {/* Advanced symptoms */}
              {(report.advSymptoms || []).length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Additional Indicators
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.advSymptoms.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 rounded-lg bg-amber-500/8 border border-amber-500/15 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50 dark:border-slate-700/30">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Risk Level
                  </span>
                  <span className={`text-[11px] font-black ${risk.text}`}>
                    {report.risk || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Date
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {report.date || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8 — Reliability & Quality */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "340ms" }}
          >
            <SectionHeader icon={FiShield} title="Reliability & Quality" />
            <div className="p-5 space-y-4">
              {[
                {
                  label: "Model Confidence",
                  value: report.confidence || "—",
                  barPct: `${confN}%`,
                  barColor: conf.bar,
                },
                {
                  label: "Data Quality",
                  value: report.dataQuality || "—",
                  barPct:
                    report.dataQuality === "High"
                      ? "90%"
                      : report.dataQuality === "Moderate"
                        ? "55%"
                        : "30%",
                  barColor:
                    report.dataQuality === "High" ? "#10b981" : "#f59e0b",
                },
                {
                  label: "Result Reliability",
                  value: report.reliability || "—",
                  barPct:
                    report.reliability === "High"
                      ? "90%"
                      : report.reliability === "Moderate"
                        ? "55%"
                        : "30%",
                  barColor:
                    report.reliability === "High" ? "#10b981" : "#f59e0b",
                },
              ].map(({ label, value, barPct, barColor }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </span>
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-200">
                      {value}
                    </span>
                  </div>
                  <Bar pct={barPct} color={barColor} />
                </div>
              ))}

              {/* Warnings from backend */}
              {(report.warnings || []).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-amber-500 mb-1">
                    Input Warnings
                  </p>
                  {report.warnings.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-400/15"
                    >
                      <FiAlertTriangle
                        size={11}
                        className="text-amber-400 mt-0.5 shrink-0"
                      />
                      <p className="text-[10px] text-amber-500/80 leading-relaxed">
                        {w}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!withXray && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-400/15 mt-2">
                  <FiInfo
                    size={12}
                    className="text-amber-400 mt-0.5 shrink-0"
                  />
                  <p className="text-[10px] text-amber-500/80 leading-relaxed">
                    Uploading an X-ray significantly improves reliability.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 9 — Next Steps */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "380ms" }}
          >
            <SectionHeader icon={FiChevronRight} title="Next Steps" />
            <div className="p-5 space-y-3">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Actions to take after reviewing this result.
              </p>
              {[
                {
                  icon: FiRefreshCw,
                  label: "Re-assessment",
                  action: "Take Again",
                  desc: "Start a new patient form",
                  onClick: onNewAssessment,
                },
                {
                  icon: FiUpload,
                  label: withXray
                    ? "Upload Better X-Ray"
                    : "Switch to X-Ray Mode",
                  action: withXray ? "Upload" : "Upgrade",
                  desc: withXray
                    ? "Go back to X-ray section"
                    : "Restart with X-ray for better accuracy",
                  onClick: withXray ? onGoToXray : onNewAssessment,
                },
                {
                  icon: FiUserCheck,
                  label: "Consult Doctor",
                  action: "Find Specialist",
                  desc: "Coming soon",
                  onClick: () => {},
                },
              ].map(({ icon: Icon, label, action, desc, onClick }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/30 dark:bg-slate-800/20 border border-white/30 dark:border-white/5 hover:border-cyan-400/40 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0">
                      <Icon size={12} className="text-cyan-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {label}
                      </p>
                      <p className="text-[9px] text-slate-400/70 truncate">
                        {desc}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClick}
                    className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors uppercase tracking-wide shrink-0 ml-2"
                  >
                    {action}
                  </button>
                </div>
              ))}

              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <span className="text-cyan-500 font-bold">AI Engine:</span>{" "}
                  {report.aiMode || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 10 — About This Result */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "420ms" }}
          >
            <SectionHeader icon={FiInfo} title="About This Result" />
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                This result is generated using advanced AI models trained on
                clinical data. It is{" "}
                <strong className="font-bold text-slate-600 dark:text-slate-300">
                  not a substitute
                </strong>{" "}
                for professional medical advice.
              </p>
              <div className="space-y-2.5">
                {[
                  "AI predictions carry inherent uncertainty",
                  "Results depend on input data quality",
                  "Always consult a licensed physician",
                  "Do not delay treatment based on AI output",
                ].map((note, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      {note}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-400/15">
                <FiAlertTriangle
                  size={13}
                  className="text-amber-400 mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400 mb-1">
                    Medical Disclaimer
                  </p>
                  <p className="text-[10px] text-amber-500/70 dark:text-amber-400/60 leading-relaxed">
                    Consult a qualified medical professional before making any
                    health decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER DISCLAIMER */}
        <div
          className="su flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-400/15 backdrop-blur-md"
          style={{ animationDelay: "460ms" }}
        >
          <FiAlertTriangle
            size={15}
            className="text-amber-400 mt-0.5 shrink-0"
          />
          <div>
            <p className="text-[11px] font-bold text-amber-500 dark:text-amber-400 mb-1">
              Medical Disclaimer
            </p>
            <p className="text-[11px] text-amber-500/70 dark:text-amber-400/60 leading-relaxed">
              This report is AI-generated and intended for informational
              purposes only. It does not constitute medical advice, diagnosis,
              or treatment. Please consult a qualified and licensed medical
              professional before making any health decisions.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400/50 pb-4">
          MediScan AI · For clinical support only · Not a substitute for
          professional medical advice
        </p>
      </div>

      {/* LIGHTBOX */}
      {imgExpanded && expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 fi"
          onClick={() => setImgExpanded(false)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImgExpanded(false)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
            >
              <FiX size={14} />
            </button>
            <img
              src={expandedImg}
              alt="Enlarged"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/10"
            />
            <p className="text-center text-white/40 text-[11px] mt-3">
              {withXray ? "Chest X-Ray" : "Scan Result"} · {patientName} ·{" "}
              {report.date}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}