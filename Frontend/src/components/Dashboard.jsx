import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  FileText,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Plus,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingDown,
  TrendingUp,
  Minus,
  Cpu,
  Zap,
  Heart,
  BarChart2,
  Scan,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════
   BACKGROUNDS
═══════════════════════════════════════════════════════════ */
const lightBg = {
  background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
};
const darkBg = {
  background:
    "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
};

/* ═══════════════════════════════════════════════════════════
   TOKEN HELPERS  (✅ NEW — guards against stale/invalid JWTs)
═══════════════════════════════════════════════════════════ */
// localStorage can end up holding the literal strings "undefined" / "null"
// if something ever stored it incorrectly. Treat those as "no token".
function getValidToken() {
  const t = localStorage.getItem("token");
  if (!t || t === "undefined" || t === "null") return null;
  return t;
}

function clearAuthAndRedirect(navigate) {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("user_id");
  navigate("/login");
}

/* ═══════════════════════════════════════════════════════════
   STYLE TOKENS
═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   CYAN THEME - TYPOGRAPHY & CARD STYLES
═══════════════════════════════════════════════════════════ */
const gText = [
  "bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-700 bg-clip-text text-transparent",
  "dark:from-cyan-100 dark:via-white dark:to-cyan-300",
  "dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)] tracking-tight",
].join(" ");

const cardCls = [
  "bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl",
  "border border-cyan-100/80 dark:border-cyan-500/10 rounded-2xl shadow-xl shadow-cyan-950/5 dark:shadow-black/30",
].join(" ");

const cardHeaderCls = [
  "px-5 py-3.5 border-b border-cyan-100/60 dark:border-cyan-500/10",
  "flex items-center gap-2.5 bg-cyan-50/20 dark:bg-slate-900/20 rounded-t-2xl",
].join(" ");

/* ═══════════════════════════════════════════════════════════
   DISEASE COLORS — Sophisticated Medical-Tech Palette
═══════════════════════════════════════════════════════════ */
const DISEASE_PALETTE = [
  "#06b6d4", // 0. Cyan (Primary Tech Accent)
  "#14b8a6", // 1. Teal
  "#0ea5e9", // 2. Sky Blue
  "#10b981", // 3. Emerald Green
  "#6366f1", // 4. Indigo
  "#f59e0b", // 5. Amber (Warning)
  "#e11d48", // 6. Rose/Crimson (Critical Alert)
  "#3b82f6", // 7. Royal Blue
  "#a855f7", // 8. Purple
  "#22c55e", // 9. Light Green
];

function getDiseaseColor(name, idx) {
  const MAP = {
    Normal: "#10b981", // Safe/Healthy - Premium Emerald
    Asthma: "#06b6d4", // Primary Cyan
    "Covid-19": "#14b8a6", // Pure Teal
    Pneumonia: "#0ea5e9", // Cool Sky Blue
    "Viral Pneumonia": "#22c55e", // Fresh Green
    COPD: "#f59e0b", // Mild Warning - Amber
    Tuberculosis: "#6366f1", // Indigo
    "Pulmonary Embolism": "#3b82f6", // Royal Blue
    "Pulmonary Fibrosis": "#a855f7", // Cool Purple
    "Lung Cancer": "#e11d48", // High Alert - Deep Rose/Red
  };
  return MAP[name] || DISEASE_PALETTE[idx % DISEASE_PALETTE.length];
}

/* ═══════════════════════════════════════════════════════════
   HEALTH SCORE LOGIC  (✅ UPGRADED)
   Now factors in, per scan:
     - Risk level          (primary driver)
     - Named disease flag  (small extra penalty vs "Normal")
     - Confidence           (how sure the model was)
     - Reliability          (input-quality flag from backend)
     - Recency weighting    (newer scans count more)
     - Trend                (is risk improving or worsening lately)
═══════════════════════════════════════════════════════════ */

// Base "health value" per risk tier (higher = healthier), replaces the
// old flat deduction table so we can blend it with trust below.
const RISK_BASE_SCORE = { Critical: 15, High: 40, Moderate: 65, Low: 95 };
const RISK_NUM = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
const NEUTRAL_SCORE = 75; // fallback when we don't trust a reading much

// Parses confidence values coming from the backend in different shapes:
// "92%", "0.92", 92, "High", etc. Returns a 0-100 number.
function parseConfidencePercent(confidence) {
  if (confidence === null || confidence === undefined) return 70;
  if (typeof confidence === "number") {
    return confidence <= 1 ? confidence * 100 : Math.min(100, confidence);
  }
  const str = String(confidence).trim();
  const numMatch = str.match(/[\d.]+/);
  if (numMatch) {
    let num = parseFloat(numMatch[0]);
    if (num <= 1) num *= 100;
    return Math.min(100, Math.max(0, num));
  }
  // Textual confidence fallback (e.g. "High"/"Moderate"/"Low")
  const lower = str.toLowerCase();
  if (lower.includes("high")) return 90;
  if (lower.includes("moderate") || lower.includes("medium")) return 65;
  if (lower.includes("low")) return 40;
  return 70;
}

// Reliability flag from the backend acts as a trust multiplier.
function reliabilityMultiplier(reliability) {
  switch (reliability) {
    case "High":
      return 1;
    case "Moderate":
      return 0.85;
    case "Low":
      return 0.6;
    default:
      return 0.85;
  }
}

// Compares the earlier half vs the later half of the recent scans (by
// numeric risk) to see whether things are trending better or worse.
// Returns a small point adjustment, capped at ±8.
function computeTrendAdjustment(recent) {
  if (!recent || recent.length < 3) return 0;

  const nums = recent.map((r) => RISK_NUM[r.risk] ?? 2);
  const mid = Math.floor(nums.length / 2);
  const earlier = nums.slice(0, mid);
  const later = nums.slice(mid);
  if (!earlier.length || !later.length) return 0;

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const diff = avg(earlier) - avg(later); // positive = risk decreasing = improving

  return Math.max(-8, Math.min(8, diff * 5));
}

function computeHealthScore(reports) {
  if (!reports || reports.length === 0) return NEUTRAL_SCORE;

  // Weight recent scans more heavily (last 5, linear weights: 1,2,3,4,5)
  const recent = reports.slice(-5);
  const weights = recent.map((_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  let weightedSum = 0;

  recent.forEach((r, i) => {
    let base = RISK_BASE_SCORE[r.risk] ?? 60;
    if (r.result && r.result !== "Normal") base -= 5;

    // How much do we trust this particular reading?
    const confPct = parseConfidencePercent(r.confidence);
    const relMult = reliabilityMultiplier(r.reliability);
    const trust = Math.min(1, (confPct / 100) * relMult);

    // Low-trust scans get pulled toward the neutral score instead of
    // fully swinging the health score up or down.
    const blended = base * trust + NEUTRAL_SCORE * (1 - trust);

    weightedSum += blended * weights[i];
  });

  let score = weightedSum / weightSum;
  score += computeTrendAdjustment(recent);

  return Math.round(Math.min(100, Math.max(15, score)));
}

/* ═══════════════════════════════════════════════════════════
   CLINICAL ALERTS — derived from latest scan
═══════════════════════════════════════════════════════════ */
function buildClinicalAlerts(latest) {
  if (!latest)
    return [
      {
        icon: Info,
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.08)",
        border: "rgba(59,130,246,0.2)",
        title: "No scan data yet",
        desc: "Run a symptom or X-ray scan to see clinical alerts.",
      },
    ];

  const alerts = [];

  // 1 — Emergency / Critical
  if (latest.isEmergency) {
    alerts.push({
      icon: AlertCircle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      title: "⚠️ Emergency condition detected",
      desc: `${latest.result} requires immediate medical attention.`,
    });
  }

  // 2 — Based on risk
  if (latest.risk === "Critical" || latest.risk === "High") {
    alerts.push({
      icon: AlertTriangle,
      color: "#f97316",
      bg: "rgba(249,115,22,0.08)",
      border: "rgba(249,115,22,0.2)",
      title: `${latest.risk} risk — consult a doctor`,
      desc: `${latest.result} detected with ${latest.confidence} confidence.`,
    });
  } else if (latest.risk === "Moderate") {
    alerts.push({
      icon: AlertCircle,
      color: "#eab308",
      bg: "rgba(234,179,8,0.08)",
      border: "rgba(234,179,8,0.2)",
      title: "Moderate risk — monitor symptoms",
      desc: `${latest.result} detected. Follow up as advised.`,
    });
  } else {
    alerts.push({
      icon: CheckCircle,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      title: "No critical conditions detected",
      desc: "Your respiratory health appears stable.",
    });
  }

  // 3 — First recommendation if available
  const rec = latest.recommendations?.[0];
  if (rec) {
    alerts.push({
      icon: Info,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
      title: "Doctor's note",
      desc: rec,
    });
  } else {
    alerts.push({
      icon: Info,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
      title: "Keep up your healthy lifestyle",
      desc: "Regular exercise and hydration recommended.",
    });
  }

  return alerts.slice(0, 3);
}

/* ═══════════════════════════════════════════════════════════
   MODEL INSIGHTS — derived from latest probabilities
═══════════════════════════════════════════════════════════ */
function buildModelInsights(latest) {
  if (!latest?.probabilities?.length) {
    return [{ factor: "No scan data", effect: "—", color: "#94a3b8", pct: 0 }];
  }
  // Top 4 by probability
  return latest.probabilities.slice(0, 4).map((p) => {
    const isNormal = p.disease === "Normal";
    const isTop = p.disease === latest.result;
    const color = isNormal ? "#22c55e" : isTop ? "#ef4444" : "#f59e0b";
    const effect = isNormal
      ? `+ Strong (Protective)`
      : isTop
        ? `⚠ ${p.pct}% likelihood`
        : `~ ${p.pct}% likelihood`;
    return { factor: p.disease, effect, color, pct: p.pct };
  });
}

/* ═══════════════════════════════════════════════════════════
   RECENT ACTIVITY — derived from latest scan
═══════════════════════════════════════════════════════════ */
function buildRecentActivity(latest) {
  if (!latest)
    return [
      {
        icon: Info,
        label: "No recent scans",
        time: "Run a scan to see activity",
        color: "#94a3b8",
      },
    ];

  const items = [];
  const timeStr = latest.date || "";

  // Diagnosis result
  items.push({
    icon: Activity,
    label: `Diagnosis Completed – ${latest.result}`,
    time: timeStr,
    color: getDiseaseColor(latest.result, 0),
  });

  // If X-ray
  if (
    latest.assessmentType?.includes("X-Ray") ||
    latest.aiMode?.includes("DenseNet")
  ) {
    items.push({
      icon: Scan,
      label: "X-Ray Analysis Completed",
      time: timeStr,
      color: "#a855f7",
    });
  }

  // Symptom analysis
  if (
    latest.assessmentType?.includes("Symptom") ||
    latest.aiMode?.includes("XGBoost")
  ) {
    items.push({
      icon: FileText,
      label: "Symptoms Analyzed",
      time: timeStr,
      color: "#3b82f6",
    });
  }

  // Hybrid
  if (
    latest.assessmentType?.includes("Hybrid") ||
    latest.aiMode?.includes("Hybrid")
  ) {
    items.push({
      icon: Cpu,
      label: "Hybrid AI Analysis Completed",
      time: timeStr,
      color: "#7c3aed",
    });
  }

  // Emergency flag
  if (latest.isEmergency) {
    items.push({
      icon: AlertTriangle,
      label: "⚠️ Emergency condition flagged",
      time: timeStr,
      color: "#ef4444",
    });
  }

  return items.slice(0, 4);
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED NUMBER
═══════════════════════════════════════════════════════════ */
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = parseInt(value) || 0;
    let start = 0;
    const step = Math.max(1, Math.ceil(end / 30));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

/* ═══════════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════════ */
function SectionHeader({ icon: Icon, label }) {
  return (
    <div className={cardHeaderCls}>
      <Icon size={14} className="text-cyan-500 shrink-0" />
      <span
        className={`text-[11px] font-black uppercase tracking-widest ${gText}`}
      >
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CUSTOM CHART TOOLTIP
═══════════════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "8px 12px",
      }}
    >
      {label && (
        <p
          style={{
            color: "#94a3b8",
            fontSize: 10,
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p
          key={i}
          style={{ color: p.color || "#a855f7", fontSize: 12, fontWeight: 700 }}
        >
          {p.name === "level"
            ? p.value >= 3
              ? "High"
              : p.value >= 2
                ? "Moderate"
                : "Low"
            : p.value}
        </p>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   HEALTH SCORE RING  (✅ now shows a trend badge)
═══════════════════════════════════════════════════════════ */
function HealthRing({ score, trend = 0 }) {
  const r = 54,
    circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const col = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Good" : score >= 50 ? "Fair" : "Poor";

  const TrendIcon =
    trend > 1.5 ? TrendingUp : trend < -1.5 ? TrendingDown : Minus;
  const trendColor =
    trend > 1.5 ? "#22c55e" : trend < -1.5 ? "#ef4444" : "#94a3b8";
  const trendLabel =
    trend > 1.5
      ? "Improving"
      : trend < -1.5
        ? "Worsening"
        : "Stable";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth="10"
        />
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="10"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)",
          }}
        />
        <text
          x="65"
          y="62"
          textAnchor="middle"
          fill={col}
          fontSize="22"
          fontWeight="900"
          fontFamily="system-ui"
        >
          {score}
        </text>
        <text
          x="65"
          y="76"
          textAnchor="middle"
          fill="rgba(148,163,184,0.7)"
          fontSize="9"
          fontWeight="700"
          fontFamily="system-ui"
        >
          /100
        </text>
      </svg>
      <span className="text-sm font-black" style={{ color: col }}>
        {label}
      </span>
      <span
        className="flex items-center gap-1 text-[10px] font-bold"
        style={{ color: trendColor }}
      >
        <TrendIcon size={11} />
        {trendLabel}
      </span>
      <span className="text-[10px] text-slate-400 text-center leading-relaxed">
        Based on risk, confidence,
        <br />
        reliability &amp; recent trend.
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROTECTED ROUTE
═══════════════════════════════════════════════════════════ */
const ProtectedRoute = ({ children }) => {
  const token = getValidToken();
  return token ? children : <Navigate to="/login" />;
};

/* ═══════════════════════════════════════════════════════════
   HEALTH SUMMARY CARDS  (5 cards, desktop grid / mobile slider)
═══════════════════════════════════════════════════════════ */
function HealthSummaryCards({
  latest,
  darkMode,
  lang,
  setSelectedReport,
  setActiveView,
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);
  const TOTAL = 5;

  const isLow = latest?.risk === "Low",
    isMod = latest?.risk === "Moderate";
  const rCol = isLow ? "#22c55e" : isMod ? "#f59e0b" : "#ef4444";
  const rTxt = isLow
    ? "text-emerald-500 dark:text-emerald-400"
    : isMod
      ? "text-amber-500 dark:text-amber-400"
      : "text-red-500 dark:text-red-400";

  const scrollTo = (idx) => {
    const clamped = Math.max(0, Math.min(TOTAL - 1, idx));
    setActiveIdx(clamped);
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      left: (el.scrollWidth / TOTAL) * clamped,
      behavior: "smooth",
    });
  };
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setActiveIdx(Math.round(el.scrollLeft / (el.scrollWidth / TOTAL)));
  };

  const cs = (bg, border, shadow) => ({
    background: bg,
    border,
    boxShadow: shadow,
  });

  // Derive AI Mode display from assessmentType / aiMode
  const aiModeLabel = latest?.assessmentType?.includes("Hybrid")
    ? "Hybrid"
    : latest?.assessmentType?.includes("X-Ray")
      ? "X-Ray Only"
      : latest?.assessmentType?.includes("Symptom")
        ? "Symptom Only"
        : latest?.aiMode?.includes("DenseNet")
          ? "X-Ray Only"
          : latest?.aiMode?.includes("XGBoost")
            ? "Symptom Only"
            : "—";

  const aiModeDesc =
    aiModeLabel === "Hybrid"
      ? "AI analysis based on symptoms + X-Ray."
      : aiModeLabel === "X-Ray Only"
        ? "AI analysis based on X-Ray image."
        : "AI analysis based on symptoms provided.";

  const cards = [
    /* 1 — Latest Diagnosis */
    <div
      key="diag"
      className="rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 h-full"
      style={cs(
        darkMode ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.05)",
        "1px solid rgba(34,197,94,0.18)",
        "0 4px 18px rgba(34,197,94,0.10),0 1px 6px rgba(0,0,0,0.06)",
      )}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.25)",
        }}
      >
        <span className="text-xl">🫁</span>
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        Latest Diagnosis
      </p>
      <p className="text-lg font-black text-emerald-500 dark:text-emerald-400 leading-tight">
        {latest?.result || "—"}
      </p>
      <p className="text-[9px] text-slate-400 leading-relaxed">
        {latest?.result === "Normal"
          ? "No signs of respiratory abnormality detected."
          : latest?.result
            ? `Indicators consistent with ${latest.result}.`
            : "No scan data available yet."}
      </p>
    </div>,

    /* 2 — Risk Level */
    <div
      key="risk"
      className="rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 h-full"
      style={cs(
        `${rCol}0d`,
        `1px solid ${rCol}30`,
        `0 4px 18px ${rCol}18,0 1px 6px rgba(0,0,0,0.06)`,
      )}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: `${rCol}18`, border: `1px solid ${rCol}35` }}
      >
        <AlertTriangle size={18} style={{ color: rCol }} />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        Risk Level
      </p>
      <p className={`text-lg font-black leading-tight ${rTxt}`}>
        {latest?.risk || "—"}
      </p>
      <p className="text-[9px] text-slate-400 leading-relaxed">
        {isLow
          ? "Your respiratory risk is currently low."
          : isMod
            ? "Monitor closely."
            : "Seek medical attention."}
      </p>
    </div>,

    /* 3 — Confidence */
    <div
      key="conf"
      className="rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 h-full"
      style={cs(
        darkMode ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.05)",
        "1px solid rgba(59,130,246,0.2)",
        "0 4px 18px rgba(59,130,246,0.12),0 1px 6px rgba(0,0,0,0.06)",
      )}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(59,130,246,0.12)",
          border: "1px solid rgba(59,130,246,0.25)",
        }}
      >
        <Zap size={18} className="text-blue-500" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        Confidence
      </p>
      <p className="text-lg font-black text-blue-500 dark:text-blue-400 leading-tight">
        {latest?.confidence || "—"}
      </p>
      <p className="text-[9px] text-slate-400 leading-relaxed">
        {latest?.reliability === "High"
          ? "High confidence in AI prediction."
          : latest?.reliability === "Moderate"
            ? "Moderate confidence — review with doctor."
            : "Low confidence — more data needed."}
      </p>
    </div>,

    /* 4 — AI Mode */
    <div
      key="mode"
      className="rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 h-full"
      style={cs(
        darkMode ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.05)",
        "1px solid rgba(168,85,247,0.2)",
        "0 4px 18px rgba(168,85,247,0.12),0 1px 6px rgba(0,0,0,0.06)",
      )}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(168,85,247,0.12)",
          border: "1px solid rgba(168,85,247,0.25)",
        }}
      >
        <Cpu size={18} className="text-violet-500" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        AI Mode
      </p>
      <p
        className="text-lg font-black leading-tight"
        style={{ color: "#a855f7" }}
      >
        {aiModeLabel}
      </p>
      <p className="text-[9px] text-slate-400 leading-relaxed">{aiModeDesc}</p>
    </div>,

    /* 5 — Recommendation */
    <div
      key="rec"
      className="rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 h-full"
      style={cs(
        darkMode ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.05)",
        "1px solid rgba(124,58,237,0.22)",
        "0 4px 18px rgba(124,58,237,0.12),0 1px 6px rgba(0,0,0,0.06)",
      )}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(124,58,237,0.12)",
          border: "1px solid rgba(124,58,237,0.28)",
        }}
      >
        <FileText size={18} className="text-violet-600 dark:text-violet-400" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        Recommendation
      </p>
      <p className="text-[12px] font-black text-violet-600 dark:text-violet-300 leading-snug">
        {latest?.recommendations?.[0] ||
          (latest?.risk === "Low"
            ? "Continue healthy lifestyle and regular monitoring."
            : latest?.risk === "Moderate"
              ? "Consult a physician and monitor symptoms."
              : "Seek immediate medical attention.")}
      </p>
    </div>,
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* desktop */}
      <div className="hidden md:grid md:grid-cols-5 gap-3">{cards}</div>

      {/* mobile slider */}
      <div className="md:hidden space-y-3">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto no-scrollbar"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              className="shrink-0 w-full"
              style={{ scrollSnapAlign: "start" }}
            >
              {card}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 px-1">
          <button
            onClick={() => scrollTo(activeIdx - 1)}
            disabled={activeIdx === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: darkMode
                ? "rgba(124,58,237,0.15)"
                : "rgba(124,58,237,0.10)",
              border: "1px solid rgba(124,58,237,0.30)",
              color: "#a855f7",
            }}
          >
            <ArrowRight size={11} style={{ transform: "rotate(180deg)" }} />
            Prev
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                style={{
                  width: i === activeIdx ? 18 : 6,
                  height: 6,
                  borderRadius: 4,
                  background:
                    i === activeIdx ? "#a855f7" : "rgba(168,85,247,0.25)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => scrollTo(activeIdx + 1)}
            disabled={activeIdx === TOTAL - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: darkMode
                ? "rgba(124,58,237,0.15)"
                : "rgba(124,58,237,0.10)",
              border: "1px solid rgba(124,58,237,0.30)",
              color: "#a855f7",
            }}
          >
            Next
            <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-3 pt-2 border-t border-white/20 dark:border-white/5">
        <p className="text-[10px] text-slate-400 flex items-center gap-1.5 text-center md:text-left">
          <CheckCircle size={11} className="text-emerald-500 shrink-0" />
          Summary is based on your latest assessment
          {latest?.date ? ` on ${latest.date}` : ""}
        </p>
        <button
          onClick={() => {
            if (setSelectedReport) setSelectedReport(latest);
            if (setActiveView) setActiveView("report-details");
          }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/10 transition-all active:scale-95 whitespace-nowrap"
          style={{ boxShadow: "0 2px 12px rgba(6, 182, 212, 0.15)" }}
        >
          {lang.viewDetails} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD CONTENT
═══════════════════════════════════════════════════════════ */
function DashboardContent({
  darkMode,
  language = "en",
  setActiveView,
  setSelectedReport,
  reports: externalReports,
}) {
  const navigate = useNavigate();
  const [reports, setReports] = useState(externalReports || []);
  const [loading, setLoading] = useState(!externalReports);
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || "User",
  );
  const [now] = useState(new Date());

  /* ── token / name from URL (Google OAuth redirect) ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromURL = params.get("token");
    const nameFromURL = params.get("name");
    if (tokenFromURL) {
      localStorage.setItem("token", tokenFromURL);
      if (nameFromURL) {
        localStorage.setItem("userName", nameFromURL);
        setUserName(nameFromURL);
      }
      window.history.replaceState({}, document.title, "/dashboard");
    }
    if (!getValidToken()) {
      clearAuthAndRedirect(navigate);
    }
  }, []);

  /* ── fetch profile ── */
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getValidToken();
      if (!token) return;
      try {
        const res = await fetch("http://localhost:5001/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          clearAuthAndRedirect(navigate);
          return;
        }
        const data = await res.json();
        if (res.ok) {
          setUserName(data.name);
          localStorage.setItem("userName", data.name);
        }
      } catch {}
    };
    fetchProfile();
  }, []);

  /* ── fetch reports from backend ── */
  const fetchReports = useCallback(async () => {
    if (externalReports) {
      setReports(externalReports);
      return;
    }
    const token = getValidToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        clearAuthAndRedirect(navigate);
        return;
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setReports(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [externalReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ═════════════════════════════════════════════════════════
     DERIVED DATA
  ═════════════════════════════════════════════════════════ */
  const latest = reports.length ? reports[reports.length - 1] : null;

  // ── Disease distribution (all time) ──
  const diseaseMap = reports.reduce((acc, r) => {
    acc[r.result] = (acc[r.result] || 0) + 1;
    return acc;
  }, {});
  const activeDiseaseData = Object.entries(diseaseMap).map(
    ([name, value], idx) => ({
      name,
      value,
      color: getDiseaseColor(name, idx),
    }),
  );
  const diseaseTotal = activeDiseaseData.reduce((s, d) => s + d.value, 0);

  // ── Risk over time ──
  const riskOverTime = reports.map((r) => ({
    date: r.date?.split(",")[0] || r.date || "",
    level:
      r.risk === "Critical"
        ? 4
        : r.risk === "High"
          ? 3
          : r.risk === "Moderate"
            ? 2
            : 1,
  }));

  // ── Reports over time ──
  // Group by date label, count per day
  const reportsOverTimeMap = reports.reduce((acc, r) => {
    const key = r.date?.split(",")[0] || r.date || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const reportsOverTime = Object.entries(reportsOverTimeMap).map(
    ([date, count]) => ({
      date,
      count,
    }),
  );

  // ── Stat cards derived ──
  const totalScans = reports.length;

  // AI system status label
  const aiSystemLabel = latest?.aiMode || "No scans yet";
  const aiSystemSub = latest?.aiMode?.includes("DenseNet")
    ? "DenseNet121 (X-ray)"
    : latest?.aiMode?.includes("XGBoost")
      ? "XGBoost (Symptom)"
      : latest?.aiMode?.includes("Hybrid")
        ? "Hybrid AI"
        : "XGBoost + DenseNet121";

  // Health score (✅ now includes confidence, reliability & trend)
  const healthScore = computeHealthScore(reports);
  const healthTrend = computeTrendAdjustment(reports.slice(-5));

  // Clinical alerts
  const clinicalAlerts = buildClinicalAlerts(latest);

  // Model insights
  const modelInsights = buildModelInsights(latest);

  // Recent activity
  const recentActivity = buildRecentActivity(latest);

  const riskTextCol =
    latest?.risk === "High" || latest?.risk === "Critical"
      ? "text-red-500 dark:text-red-400"
      : latest?.risk === "Moderate"
        ? "text-amber-500 dark:text-amber-400"
        : "text-emerald-500 dark:text-emerald-400";

  const lastUpdated = latest?.date
    ? `Last updated: ${latest.date}`
    : `Last updated: ${now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`;

  /* ── translations ── */
  const t = {
    en: {
      welcome: "Welcome back",
      overview: "Here's your respiratory health overview.",
      viewDetails: "View Full Details",
      newCheck: "New Symptom Check",
      uploadXray: "Upload X-Ray",
      viewReports: "View All Reports",
      bookAppt: "Book Appointment",
    },
    bn: {
      welcome: "ফিরে আসায় স্বাগতম",
      overview: "আজকের আপনার স্বাস্থ্য সারাংশ।",
      viewDetails: "বিস্তারিত দেখুন",
      newCheck: "নতুন স্ক্রিনিং",
      uploadXray: "এক্স-রে আপলোড",
      viewReports: "সব রিপোর্ট",
      bookAppt: "অ্যাপয়েন্টমেন্ট",
    },
    hi: {
      welcome: "वापसी पर स्वागत है",
      overview: "आज का स्वास्थ्य सारांश।",
      viewDetails: "विवरण देखें",
      newCheck: "नई जांच",
      uploadXray: "X-रे अपलोड",
      viewReports: "सभी रिपोर्ट",
      bookAppt: "अपॉइंटमेंट",
    },
  };
  const lang = t[language] || t.en;

  /* ═════════════════════════════════════════════════════════
     RENDER
  ═════════════════════════════════════════════════════════ */
  return (
    <div
      className="p-4 md:p-6 lg:p-8 min-h-screen transition-all duration-300"
      style={darkMode ? darkBg : lightBg}
    >
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow{ 0%,100%{opacity:1} 50%{opacity:0.4} }
        .su { animation:slideUp 0.38s cubic-bezier(.4,0,.2,1) both; }
        .pulse-glow { animation:pulseGlow 2s infinite; }
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
            <p className="text-white text-sm font-semibold">
              Loading your health data…
            </p>
          </div>
        </div>
      )}

      <div className="max-w-400 mx-auto space-y-5">
        {/* ══════════ HEADER ══════════ */}
        <div className="su flex flex-col sm:flex-row sm:items-start justify-between gap-2 pt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex flex-wrap items-baseline gap-x-2">
              <span className={gText}>{lang.welcome},</span>
              <span className="text-slate-800 dark:text-white font-semibold">
                {userName} 👋
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {lang.overview}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold self-start sm:self-auto sm:text-right shrink-0">
            {lastUpdated}
          </p>
        </div>

        {/* ══════════ STAT CARDS ══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total Scans */}
          <div
            className={`su ${cardCls} p-4 md:p-5 space-y-3`}
            style={{ animationDelay: "40ms" }}
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
              <FileText size={16} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Scans
              </p>
              <h2 className={`text-base font-black mt-1 ${gText}`}>
                <AnimatedNumber value={totalScans} />
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">All time scans</p>
            </div>
          </div>

          {/* Latest Result */}
          <div
            className={`su ${cardCls} p-4 md:p-5 space-y-3`}
            style={{ animationDelay: "80ms" }}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <Activity size={16} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Latest Result
              </p>
              <h2 className="text-base font-black mt-1 text-emerald-500 dark:text-emerald-400">
                {latest?.result || "—"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                {latest?.date || "No data yet"}
              </p>
            </div>
          </div>

          {/* Risk Level */}
          <div
            className={`su ${cardCls} p-4 md:p-5 space-y-3`}
            style={{ animationDelay: "120ms" }}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Risk Level
              </p>
              <h2 className={`text-base font-black mt-1 ${riskTextCol}`}>
                {latest?.risk || "—"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                {latest?.risk === "Low"
                  ? "Stay healthy!"
                  : latest?.risk === "Moderate"
                    ? "Monitor closely"
                    : latest?.risk
                      ? "Seek attention"
                      : "Run a scan"}
              </p>
            </div>
          </div>

          {/* AI System Status */}
          <div
            className={`su ${cardCls} p-4 md:p-5 space-y-3`}
            style={{ animationDelay: "160ms" }}
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-cyan-500/15 flex items-center justify-center">
              <Cpu size={16} className="text-cyan-500 pulse-glow" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                AI System Status
              </p>
              <h2 className={`text-base font-black mt-1 leading-snug ${gText}`}>
                {latest ? "Active" : "Ready"}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {aiSystemSub}
              </p>
            </div>
          </div>
        </div>

        {/* ══════════ AI HEALTH SUMMARY ══════════ */}
        <div
          className="su rounded-3xl overflow-hidden"
          style={{
            animationDelay: "200ms",
            background: darkMode
              ? "rgba(15,12,41,0.7)"
              : "rgba(255,255,255,0.72)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: darkMode
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(255,255,255,0.8)",
            boxShadow: darkMode
              ? "0 8px 40px rgba(124,58,237,0.18),0 2px 12px rgba(0,0,0,0.4)"
              : "0 8px 40px rgba(124,58,237,0.10),0 2px 16px rgba(139,92,246,0.08)",
          }}
        >
          <div className={cardHeaderCls}>
            <Heart size={14} className="text-cyan-500 shrink-0" />
            <span
              className={`text-[11px] font-black uppercase tracking-widest ${gText}`}
            >
              AI Health Summary
            </span>
          </div>
          {latest ? (
            <HealthSummaryCards
              latest={latest}
              darkMode={darkMode}
              lang={lang}
              setSelectedReport={setSelectedReport}
              setActiveView={setActiveView}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm">
                No scans yet. Run a symptom check or upload an X-ray to see your
                health summary.
              </p>
            </div>
          )}
        </div>

        {/* ══════════ CHARTS ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Disease Distribution */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "240ms" }}
          >
            <SectionHeader
              icon={BarChart2}
              label="Disease Distribution (All Time)"
            />
            <div className="p-5">
              {activeDiseaseData.length === 0 ? (
                <p className="text-slate-400 text-[11px] text-center py-8">
                  No data yet.
                </p>
              ) : (
                <div className="flex items-center gap-5">
                  <div className="shrink-0" style={{ width: 130, height: 130 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeDiseaseData}
                          dataKey="value"
                          innerRadius={42}
                          outerRadius={60}
                          paddingAngle={2}
                          stroke="none"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {activeDiseaseData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {activeDiseaseData.map((d, i) => {
                      const pct = diseaseTotal
                        ? Math.round((d.value / diseaseTotal) * 100)
                        : d.value;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: d.color }}
                            />
                            <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                              {d.name}
                            </span>
                          </div>
                          <span
                            className="text-[11px] font-black shrink-0"
                            style={{ color: d.color }}
                          >
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Risk Levels Over Time */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "280ms" }}
          >
            <SectionHeader icon={TrendingDown} label="Risk Levels Over Time" />
            <div className="p-5">
              {riskOverTime.length === 0 ? (
                <p className="text-slate-400 text-[11px] text-center py-8">
                  No data yet.
                </p>
              ) : (
                <div className="h-29 relative">
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                    <span className="text-[9px] text-slate-400 font-semibold">
                      High
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      Moderate
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      Low
                    </span>
                  </div>
                  <div className="pl-14">
                    <ResponsiveContainer width="100%" height={144}>
                      <LineChart
                        data={riskOverTime}
                        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="riskLineGrad"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.08)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 9 }}
                        />
                        <YAxis hide domain={[0.5, 4.5]} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="level"
                          stroke="url(#riskLineGrad)"
                          strokeWidth={3}
                          dot={{
                            r: 5,
                            fill: "#06b6d4",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reports Over Time */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "320ms" }}
          >
            <SectionHeader icon={BarChart2} label="Reports Over Time" />
            <div className="p-5">
              {reportsOverTime.length === 0 ? (
                <p className="text-slate-400 text-[11px] text-center py-8">
                  No data yet.
                </p>
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportsOverTime}
                      barSize={16}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <defs>
                        {/* পার্পল গ্রেডিয়েন্ট বদলে সায়ান গ্রেডিয়েন্ট করা হলো */}
                        <linearGradient
                          id="barGradCyan"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#06b6d4" /* Bright Cyan */
                            stopOpacity={1}
                          />
                          <stop
                            offset="100%"
                            stopColor="#0e7490" /* Deep Cyan */
                            stopOpacity={0.8}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148,163,184,0.08)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 9 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 9 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="count"
                        fill="url(#barGradCyan)" /* এখানে নতুন আইডি রেফার করা হয়েছে */
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ BOTTOM ROW ══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Recent AI Activity */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "360ms" }}
          >
            <SectionHeader icon={Activity} label="Recent AI Activity" />
            <div className="p-4 divide-y divide-white/10 dark:divide-white/5">
              {recentActivity.map(({ icon: Icon, label, time, color }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}35`,
                    }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                      {label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Alerts */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "400ms" }}
          >
            <SectionHeader icon={AlertCircle} label="Clinical Alerts" />
            <div className="p-4 space-y-2.5">
              {clinicalAlerts.map(
                ({ icon: Icon, color, bg, border, title, desc }, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={13} style={{ color }} />
                      <p
                        className="text-[11px] font-bold leading-snug"
                        style={{ color }}
                      >
                        {title}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Health Score */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "440ms" }}
          >
            <SectionHeader icon={Heart} label="Health Score" />
            <div className="p-5 flex items-center justify-center">
              <HealthRing score={healthScore} trend={healthTrend} />
            </div>
          </div>

          {/* Model Insights */}
          <div
            className={`su ${cardCls} overflow-hidden`}
            style={{ animationDelay: "480ms" }}
          >
            <SectionHeader icon={Zap} label="Model Insights" />
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Top Influential Factors
              </p>
              <div className="space-y-3">
                {modelInsights.map(({ factor, effect, color, pct }, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex-1">
                        {factor}
                      </span>
                      <span
                        className="text-[10px] font-bold shrink-0"
                        style={{ color }}
                      >
                        {effect}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(to right,#7c3aed,${color})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-400/60 mt-3">
                Insights generated by Explainable AI
              </p>
            </div>
          </div>
        </div>

        {/* ══════════ QUICK ACTIONS ══════════ */}
        <div
          className={`su ${cardCls} overflow-hidden`}
          style={{ animationDelay: "520ms" }}
        >
          <SectionHeader icon={Zap} label="Quick Actions" />
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: Plus,
                  label: lang.newCheck,
                  grad: "from-violet-600 via-purple-500 to-indigo-700",
                  shadow: "shadow-violet-500/30",
                  onClick: () =>
                    setActiveView && setActiveView("patient-dashboard"),
                },
                {
                  icon: Upload,
                  label: lang.uploadXray,
                  grad: "from-blue-600 via-blue-500 to-cyan-600",
                  shadow: "shadow-blue-500/30",
                  onClick: () =>
                    setActiveView && setActiveView("patient-dashboard"),
                },
                {
                  icon: FileText,
                  label: lang.viewReports,
                  grad: "from-emerald-600 via-emerald-500 to-teal-600",
                  shadow: "shadow-emerald-500/30",
                  onClick: () => setActiveView && setActiveView("reports"),
                },
                {
                  icon: Calendar,
                  label: lang.bookAppt,
                  grad: "from-teal-500 via-cyan-500 to-sky-500",
                  shadow: "shadow-cyan-500/30",
                  onClick: () => setActiveView && setActiveView("appointments"),
                },
              ].map(({ icon: Icon, label, grad, shadow, onClick }, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={onClick}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl
                    bg-linear-to-br ${grad} text-white border border-white/20
                    shadow-lg ${shadow} hover:brightness-110 hover:-translate-y-0.5
                    active:scale-95 transition-all duration-200`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-bold text-center uppercase tracking-wide leading-tight">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400/50 pb-2">
          MediScan AI · For clinical support only · Not a substitute for
          professional medical advice
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════════════ */
export default function Dashboard(props) {
  return (
    <ProtectedRoute>
      <DashboardContent {...props} />
    </ProtectedRoute>
  );
}