import { useEffect, useState, useMemo, useRef } from "react";
import {
  Clock,
  Trash2,
  Search,
  ScanLine,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Activity,
  Cpu,
  X,
  Filter,
  Layers,
  Download,
  FileText,
  Maximize2,
  Info,
  Star,
  User,
  Zap,
} from "lucide-react";
import { generateMediScanPDF } from "./pdfReportGenerator";

/* ═══════════════════════════════════════════════════════════
   STYLE TOKENS
═══════════════════════════════════════════════════════════ */
const lightBg = {
  background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
};
const darkBg = {
  background:
    "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
};

const gText = [
  "bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent",
  "dark:from-cyan-100 dark:via-white dark:to-cyan-300",
  "dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)] tracking-tight",
].join(" ");

const cardCls = [
  "bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl",
  "border border-white/40 dark:border-white/5 rounded-2xl shadow-xl",
].join(" ");

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const RISK_STYLE = {
  Critical: {
    text: "text-red-600 dark:text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    dot: "bg-red-500",
  },
  High: {
    text: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
  Moderate: {
    text: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  Low: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
};
const getRisk = (r) => RISK_STYLE[r] || RISK_STYLE.Moderate;

function getActivityType(item) {
  if (item._kind === "appointment" || item.type === "appointment")
    return "appointment";
  const mode = (item.aiMode || item.assessmentType || "").toLowerCase();
  if (
    mode.includes("densenet") ||
    mode.includes("x-ray") ||
    mode.includes("xray")
  )
    return "xray";
  if (mode.includes("hybrid")) return "hybrid";
  return "symptom";
}

const TYPE_META = {
  xray: {
    label: "X-Ray Analysis",
    icon: ScanLine,
    color: "#0a88a9",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.25)",
  },
  symptom: {
    label: "Symptom Analysis",
    icon: Activity,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)",
  },
  hybrid: {
    label: "Hybrid Analysis",
    icon: Cpu,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
    border: "rgba(124,58,237,0.25)",
  },
  appointment: {
    label: "Appointment",
    icon: Calendar,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.25)",
  },
};

function groupByMonth(items) {
  const map = new Map();
  items.forEach((item) => {
    const d = new Date(
      item.datetime || item.date || item.scan_date || Date.now(),
    );
    const key = isNaN(d)
      ? "Unknown"
      : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function formatDateTime(item) {
  const raw = item.datetime || item.date || item.scan_date;
  if (!raw) return { date: "—", time: "—" };
  try {
    const d = new Date(raw);
    if (isNaN(d)) return { date: raw, time: "" };
    return {
      date: d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  } catch {
    return { date: raw, time: "" };
  }
}

/* ═══════════════════════════════════════════════════════════
   THEME-AWARE STYLE HELPERS FOR MODALS
═══════════════════════════════════════════════════════════ */
function modalBg(isDark) {
  return isDark
    ? "#162235"
    : "#FFFFFF";
}
function modalBorder(isDark) {
  return isDark
    ? "1px solid rgba(56, 189, 248, 0.18)"
    : "1px solid rgba(203, 213, 225, 0.8)";
}
function modalBoxShadow(isDark) {
  return isDark
    ? "0 20px 60px rgba(0,0,0,0.55), 0 0 30px rgba(6,182,212,0.08)"
    : "0 20px 50px rgba(0,0,0,0.08)";
}

/* Section header backgrounds (light vs dark) */
function sectionHdr(color, isDark) {
  const alphaMap = {
    cyan: isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.06)",
    blue: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)",
    emerald: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)",
    amber: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
  };
  return alphaMap[color] || alphaMap.cyan;
}

/* Card bg inside modal */
function sectionCardBg(isDark) {
  return isDark ? "rgba(255,255,255,0.03)" : "rgba(124,58,237,0.03)";
}
function sectionCardBorder(isDark) {
  return isDark
    ? "1px solid rgba(255,255,255,0.07)"
    : "1px solid rgba(124,58,237,0.1)";
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED CONFIDENCE BAR
═══════════════════════════════════════════════════════════ */
function ConfBar({ pct, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.width = "0%";
    const t = setTimeout(() => {
      el.style.width = `${pct}%`;
    }, 120);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        ref={ref}
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ background: color, width: "0%" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INFO ROW
═══════════════════════════════════════════════════════════ */
function InfoRow({ label, value, valueClass, isDark }) {
  const defaultVal = isDark ? "text-slate-200" : "text-slate-700";
  return (
    <div
      className="flex items-start justify-between gap-3 py-2 last:border-0"
      style={{
        borderBottom: isDark
          ? "1px solid rgba(255,255,255,0.05)"
          : "1px solid rgba(124,58,237,0.08)",
      }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-wider shrink-0"
        style={{ color: isDark ? "#94a3b8" : "#0A88A9" }}
      >
        {label}
      </span>
      <span
        className={`text-[11px] font-semibold text-right ${valueClass || defaultVal}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   IMAGE PREVIEW CARD
═══════════════════════════════════════════════════════════ */
function ImageCard({ src, label, onExpand, isDark }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white"
          style={{  background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
        >
          {label}
        </span>
      </div>
      <div
        onClick={() => src && onExpand(src)}
        className={`relative h-36 sm:h-44 rounded-xl overflow-hidden group ${src ? "cursor-pointer" : ""}`}
        style={{
          border: isDark
            ? "2px solid rgba(255,255,255,0.1)"
            : "2px solid rgba(124,58,237,0.15)",
          background: isDark ? "rgba(15,12,41,0.4)" : "rgba(124,58,237,0.04)",
        }}
      >
        {src ? (
          <>
            <img
              src={src}
              alt={label}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Maximize2 size={16} className="text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
              <FileText size={16} className="text-cyan-400" />
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Not available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════════════════ */
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-200 bg-black/95 flex items-center justify-center p-4 sm:p-6"
      style={{ animation: "fadeIn 0.2s ease both" }}
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
        >
          <X size={14} />
        </button>
        <img
          src={src}
          alt="Preview"
          className="w-full max-h-[80vh] object-contain rounded-2xl border border-white/10"
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL WRAPPER — fully theme-aware
═══════════════════════════════════════════════════════════ */
function ModalWrapper({ onClose, children, wide = false, isDark }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
      style={{
        background: isDark ? "rgba(0,0,0,0.75)" : "rgba(109,40,217,0.15)",
        backdropFilter: "blur(8px)",
        animation: "modalFadeIn 0.22s ease both",
      }}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${wide ? "sm:max-w-4xl" : "sm:max-w-xl"} max-h-[95vh] sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden`}
        style={{
          background: modalBg(isDark),
          border: modalBorder(isDark),
          boxShadow: modalBoxShadow(isDark),
          animation: "modalScaleIn 0.25s cubic-bezier(.34,1.56,.64,1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div
            className="w-10 h-1 rounded-full"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(124,58,237,0.25)",
            }}
          />
        </div>
        {children}
      </div>
      <style>{`
        @keyframes modalFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes modalScaleIn { from{opacity:0;transform:scale(0.96) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
      `}</style>
    </div>
  );
}

/* ─── Modal Header ─── */
function ModalHeader({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  onClose,
  isDark,
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 shrink-0"
      style={{
        borderBottom: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(124,58,237,0.1)",
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.02)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: `${iconColor}18`,
            border: `1px solid ${iconColor}30`,
          }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <div>
          <h2
            className={`text-sm sm:text-base font-black tracking-tight ${gText}`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-[10px] sm:text-[11px] mt-0.5"
              style={{ color: isDark ? "#94a3b8" : "#0a88a9" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0 mt-0.5"
        style={{
          background: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(124,58,237,0.06)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(124,58,237,0.12)",
          color: isDark ? "#94a3b8" : "#0a88a9",
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── Modal Footer ─── */
function ModalFooter({ onDownload, isDark }) {
  if (!onDownload) return null;
  return (
    <div
      className="flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 shrink-0"
      style={{
        borderTop: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(124,58,237,0.1)",
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.02)",
      }}
    >
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider
          text-white bg-linear-to-r from-emerald-600 to-teal-600
          border border-white/15 shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)]
          hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all"
      >
        <Download size={13} /> Download Report
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION CARD WRAPPER (reusable inside modals)
═══════════════════════════════════════════════════════════ */
function SectionCard({
  headerColor = "cyan",
  headerIcon: HIcon,
  headerLabel,
  children,
  isDark,
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: sectionCardBg(isDark),
        border: sectionCardBorder(isDark),
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{
          background: sectionHdr(headerColor, isDark),
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(124,58,237,0.08)",
        }}
      >
        <HIcon
          size={12}
          style={{
            color:
              headerColor === "cyan"
                ? "#0a88a9"
                : headerColor === "blue"
                  ? "#60a5fa"
                  : headerColor === "emerald"
                    ? "#34d399"
                    : "#fbbf24",
          }}
        />
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{
            color:
              headerColor === "cyan"
                ? isDark
                  ? "#0a88a9"
                  : "#0a88a9"
                : headerColor === "blue"
                  ? isDark
                    ? "#60a5fa"
                    : "#2563eb"
                  : headerColor === "emerald"
                    ? isDark
                      ? "#34d399"
                      : "#059669"
                    : isDark
                      ? "#fbbf24"
                      : "#d97706",
          }}
        >
          {headerLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   XRAY / SYMPTOM / HYBRID MODAL
═══════════════════════════════════════════════════════════ */
function ScanModal({ item, onClose, isDark }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const type = getActivityType(item);
  const meta = TYPE_META[type] || TYPE_META.symptom;
  const risk = getRisk(item.risk);
  const confN = parseFloat((item.confidence || "0").replace("%", ""));
  const { date, time } = formatDateTime(item);
  const isXray = type === "xray" || type === "hybrid";

  const confColor =
    confN >= 80 ? "#10b981" : confN >= 60 ? "#f59e0b" : "#ef4444";
  const confTextCls =
    confN >= 80
      ? isDark
        ? "text-emerald-400"
        : "text-emerald-600"
      : confN >= 60
        ? isDark
          ? "text-amber-400"
          : "text-amber-600"
        : isDark
          ? "text-red-400"
          : "text-red-600";

  const userName =
    item.patientName ||
    item.name ||
    (typeof localStorage !== "undefined" && localStorage.getItem("userName")) ||
    "Patient";

  const xrayDesc = (() => {
    const r = (item.result || "").toLowerCase();
    const c = item.confidence || "";
    const MAP = {
      normal:
        "No significant opacity, consolidation, or pathological patterns detected. Lung fields appear clear.",
      pneumonia: `AI detected opacity and consolidation patterns consistent with pneumonia (${c} confidence).`,
      tuberculosis: `Upper lobe infiltrates detected, consistent with pulmonary tuberculosis (${c} confidence).`,
      "lung cancer": `Irregular mass or nodular opacity detected. Further imaging strongly recommended (${c} confidence).`,
      covid: `Bilateral ground-glass opacities detected, consistent with COVID-19 pneumonitis (${c} confidence).`,
      fibrosis: `Diffuse reticular pattern detected, consistent with pulmonary fibrosis (${c} confidence).`,
      effusion: `Blunting of costophrenic angle detected, suggesting pleural effusion (${c} confidence).`,
      emphysema: `Hyperinflation and flattened diaphragm detected, consistent with emphysematous changes (${c} confidence).`,
      atelectasis: `Increased opacity with volume loss, consistent with atelectasis (${c} confidence).`,
      pneumothorax: `Absence of lung markings detected, consistent with pneumothorax. Seek emergency care (${c} confidence).`,
    };
    for (const [key, val] of Object.entries(MAP)) {
      if (r.includes(key)) return val;
    }
    return `${item.result || "Condition"} detected with ${c} confidence. Consult a pulmonologist for interpretation.`;
  })();

  /* ── PDF Download (shared, theme-matched generator) ── */
  const handleDownload = async () => {
    try {
      await generateMediScanPDF(item, { patientNameOverride: userName });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    }
  };

  /* text colors for modal body */
  const bodyText = isDark ? "#e2e8f0" : "#1e293b";
  const mutedText = isDark ? "#94a3b8" : "#0a88a9";

  return (
    <>
      <ModalWrapper onClose={onClose} wide={isXray} isDark={isDark}>
        <ModalHeader
          icon={meta.icon}
          iconColor={meta.color}
          title={`${meta.label} Details`}
          subtitle={`${date}${time ? ` · ${time}` : ""}`}
          onClose={onClose}
          isDark={isDark}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div
            className={`p-3 sm:p-5 ${isXray ? "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5" : "space-y-4"}`}
          >
            {/* ── LEFT COLUMN ── */}
            <div className="space-y-3 sm:space-y-4">
              {/* Patient Information */}
              <SectionCard
                headerColor="cyan"
                headerIcon={User}
                headerLabel="Patient Information"
                isDark={isDark}
              >
                <div className="px-4 py-1">
                  <InfoRow
                    label="Patient Name"
                    value={userName}
                    isDark={isDark}
                  />
                </div>
              </SectionCard>

              {/* Analysis Info */}
              <SectionCard
                headerColor="cyan"
                headerIcon={Info}
                headerLabel="Analysis Information"
                isDark={isDark}
              >
                <div className="px-4 py-1">
                  <InfoRow
                    label="Analysis Type"
                    value={meta.label}
                    isDark={isDark}
                  />
                  <InfoRow label="Date" value={date} isDark={isDark} />
                  {time && (
                    <InfoRow label="Time" value={time} isDark={isDark} />
                  )}
                  <InfoRow
                    label="Result"
                    value={item.result || "—"}
                    valueClass={
                      (item.result || "").toLowerCase() === "normal"
                        ? isDark
                          ? "text-emerald-400 font-black"
                          : "text-emerald-600 font-black"
                        : isDark
                          ? "text-red-400 font-black"
                          : "text-red-600 font-black"
                    }
                    isDark={isDark}
                  />
                  <InfoRow
                    label="Risk Level"
                    value={item.risk ? `${item.risk} Risk` : "—"}
                    valueClass={`${risk.text} font-black`}
                    isDark={isDark}
                  />
                  <InfoRow
                    label="Confidence"
                    value={item.confidence || "—"}
                    valueClass={`${confTextCls} font-black`}
                    isDark={isDark}
                  />
                  <InfoRow
                    label="AI Model"
                    value={
                      item.aiMode?.includes("DenseNet")
                        ? "DenseNet121"
                        : item.aiMode?.includes("XGBoost")
                          ? "XGBoost"
                          : item.aiMode || "—"
                    }
                    isDark={isDark}
                  />
                  <InfoRow
                    label="Status"
                    value="Completed"
                    valueClass={
                      isDark
                        ? "text-emerald-400 font-semibold"
                        : "text-emerald-600 font-semibold"
                    }
                    isDark={isDark}
                  />
                </div>
              </SectionCard>

              {/* Confidence bar */}
              <div
                className="rounded-2xl p-3 sm:p-4 space-y-2"
                style={{
                  background: sectionCardBg(isDark),
                  border: sectionCardBorder(isDark),
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: isDark ? "#94a3b8" : "#0a88a9" }}
                  >
                    Confidence Score
                  </span>
                  <span className={`text-sm font-black ${confTextCls}`}>
                    {item.confidence || "—"}
                  </span>
                </div>
                <ConfBar pct={confN} color={confColor} />
                <div className="flex justify-between">
                  {["0%", "25%", "50%", "75%", "100%"].map((l) => (
                    <span
                      key={l}
                      className="text-[9px] font-semibold"
                      style={{ color: isDark ? "#64748b" : "#0a88a9" }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Interpretation */}
              <SectionCard
                headerColor="blue"
                headerIcon={Zap}
                headerLabel={isXray ? "X-Ray Interpretation" : "AI Analysis"}
                isDark={isDark}
              >
                <div className="px-4 py-3">
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: isDark ? "#cbd5e1" : "#334155" }}
                  >
                    {xrayDesc}
                  </p>
                </div>
              </SectionCard>

              {/* Symptoms */}
              {!isXray && (item.symptoms || []).length > 0 && (
                <SectionCard
                  headerColor="blue"
                  headerIcon={Activity}
                  headerLabel="Submitted Symptoms"
                  isDark={isDark}
                >
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {item.symptoms.map((s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                        style={{
                          background: "rgba(59,130,246,0.1)",
                          border: "1px solid rgba(59,130,246,0.2)",
                          color: "#93c5fd",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Severity */}
              {!isXray &&
                item.severity &&
                Object.keys(item.severity).length > 0 && (
                  <SectionCard
                    headerColor="amber"
                    headerIcon={AlertTriangle}
                    headerLabel="Severity Details"
                    isDark={isDark}
                  >
                    <div className="px-4 py-2">
                      {Object.entries(item.severity).map(([k, v]) => (
                        <InfoRow
                          key={k}
                          label={k}
                          value={v}
                          valueClass={
                            isDark
                              ? "text-amber-400 font-semibold"
                              : "text-amber-600 font-semibold"
                          }
                          isDark={isDark}
                        />
                      ))}
                    </div>
                  </SectionCard>
                )}

              {/* Warnings */}
              {(item.warnings || []).length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: isDark
                      ? "rgba(245,158,11,0.05)"
                      : "rgba(245,158,11,0.05)",
                    border: isDark
                      ? "1px solid rgba(245,158,11,0.2)"
                      : "1px solid rgba(245,158,11,0.25)",
                  }}
                >
                  <div
                    className="px-4 py-2.5 flex items-center gap-2"
                    style={{
                      borderBottom: isDark
                        ? "1px solid rgba(245,158,11,0.15)"
                        : "1px solid rgba(245,158,11,0.15)",
                    }}
                  >
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      Input Warnings
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {item.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <p className="text-[10px] text-amber-400/80 leading-relaxed">
                          {w}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {(item.recommendations || []).length > 0 && (
                <SectionCard
                  headerColor="emerald"
                  headerIcon={Star}
                  headerLabel="Recommendations"
                  isDark={isDark}
                >
                  <div className="px-4 py-3 space-y-2">
                    {item.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle
                          size={11}
                          className={
                            isDark
                              ? "text-emerald-400 mt-0.5 shrink-0"
                              : "text-emerald-500 mt-0.5 shrink-0"
                          }
                        />
                        <p
                          className="text-[11px] leading-relaxed"
                          style={{ color: isDark ? "#cbd5e1" : "#334155" }}
                        >
                          {r}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Disease Probabilities */}
              {(item.probabilities || []).length > 0 && (
                <SectionCard
                  headerColor="cyan"
                  headerIcon={Zap}
                  headerLabel="Disease Probabilities"
                  isDark={isDark}
                >
                  <div className="px-4 py-3 space-y-3">
                    {item.probabilities.map((p, i) => {
                      const c =
                        i === 0
                          ? "#ef4444"
                          : i === 1
                            ? "#f97316"
                            : i === 2
                              ? "#f59e0b"
                              : "#94a3b8";
                      return (
                        <div key={p.disease} className="space-y-1">
                          <div className="flex justify-between">
                            <span
                              className="text-[11px]"
                              style={{ color: isDark ? "#cbd5e1" : "#334155" }}
                            >
                              {p.disease}
                            </span>
                            <span
                              className="text-[11px] font-black"
                              style={{ color: c }}
                            >
                              {p.pct}%
                            </span>
                          </div>
                          <ConfBar pct={p.pct} color={c} />
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              )}
            </div>

            {/* ── RIGHT COLUMN (X-Ray / Hybrid only) ── */}
            {isXray && (
              <div className="space-y-3 sm:space-y-4">
                <ImageCard
                  src={item.originalXray}
                  label="X-Ray Image"
                  onExpand={setLightboxSrc}
                  isDark={isDark}
                />
                <ImageCard
                  src={item.gradcam}
                  label="Grad-CAM Heatmap"
                  onExpand={setLightboxSrc}
                  isDark={isDark}
                />

                {item.isEmergency && (
                  <div
                    className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      className="text-red-400 mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-[11px] font-bold text-red-400 mb-1">
                        ⚠️ Emergency Condition
                      </p>
                      <p className="text-[10px] text-red-400/70 leading-relaxed">
                        This result requires immediate medical attention. Please
                        go to emergency care.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`flex items-center gap-3 p-4 rounded-2xl ${risk.bg} border ${risk.border}`}
                >
                  <div className={`w-3 h-3 rounded-full ${risk.dot}`} />
                  <div>
                    <p className={`text-sm font-black ${risk.text}`}>
                      {item.risk} Risk
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: isDark ? "#94a3b8" : "#0a88a9" }}
                    >
                      {item.risk === "Critical" || item.risk === "High"
                        ? "Immediate consultation required"
                        : item.risk === "Moderate"
                          ? "Monitor symptoms closely"
                          : "No immediate action needed"}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-start gap-2.5 p-3 rounded-xl"
                  style={{
                    background: isDark
                      ? "rgba(245,158,11,0.05)"
                      : "rgba(245,158,11,0.06)",
                    border: isDark
                      ? "1px solid rgba(245,158,11,0.15)"
                      : "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <AlertTriangle
                    size={12}
                    className="text-amber-400 mt-0.5 shrink-0"
                  />
                  <p className="text-[10px] text-amber-400/70 leading-relaxed">
                    AI-generated results are for informational purposes only.
                    Consult a licensed physician.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ModalFooter onDownload={handleDownload} isDark={isDark} />
      </ModalWrapper>

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPOINTMENT MODAL
═══════════════════════════════════════════════════════════ */
function AppointmentModal({ item, onClose, isDark }) {
  const { date: bookingDate, time: bookingTime } = formatDateTime(item);

  const statusStyle =
    (item.status || "confirmed").toLowerCase() === "confirmed"
      ? {
          text: isDark ? "text-emerald-400" : "text-emerald-600",
          bg: "rgba(16,185,129,0.1)",
          border: "rgba(16,185,129,0.25)",
        }
      : (item.status || "").toLowerCase() === "cancelled"
        ? {
            text: "text-red-400",
            bg: "rgba(239,68,68,0.1)",
            border: "rgba(239,68,68,0.25)",
          }
        : {
            text: isDark ? "text-amber-400" : "text-amber-600",
            bg: "rgba(245,158,11,0.1)",
            border: "rgba(245,158,11,0.25)",
          };

  const userName =
    item.name ||
    (typeof localStorage !== "undefined" && localStorage.getItem("userName")) ||
    "Patient";

  return (
    <ModalWrapper onClose={onClose} wide={false} isDark={isDark}>
      <ModalHeader
        icon={Calendar}
        iconColor="#10b981"
        title="Appointment Details"
        subtitle={`Booked on ${bookingDate}${bookingTime ? ` · ${bookingTime}` : ""}`}
        onClose={onClose}
        isDark={isDark}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-5 space-y-3 sm:space-y-4">
        {/* Status banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: statusStyle.bg,
            border: `1px solid ${statusStyle.border}`,
          }}
        >
          <CheckCircle size={15} className={statusStyle.text} />
          <div>
            <p className={`text-sm font-black ${statusStyle.text}`}>
              {item.status || "Confirmed"}
            </p>
            <p
              className="text-[10px]"
              style={{ color: isDark ? "#94a3b8" : "#0a88a9" }}
            >
              Appointment status
            </p>
          </div>
        </div>

        {/* Appointment Info */}
        <SectionCard
          headerColor="emerald"
          headerIcon={Calendar}
          headerLabel="Appointment Information"
          isDark={isDark}
        >
          <div className="px-4 py-1">
            <InfoRow
              label="Doctor"
              value={item.doctor || "—"}
              isDark={isDark}
            />
            <InfoRow
              label="Hospital"
              value={item.hospital || "—"}
              isDark={isDark}
            />
            <InfoRow
              label="Department"
              value={item.type || "—"}
              isDark={isDark}
            />
            <InfoRow
              label="Appointment Date"
              value={item.date || "—"}
              isDark={isDark}
            />
            <InfoRow
              label="Appointment Time"
              value={item.time || "—"}
              isDark={isDark}
            />
            <InfoRow
              label="Appointment Type"
              value={
                item.appointmentType || item.type || "General Consultation"
              }
              isDark={isDark}
            />
            <InfoRow
              label="Status"
              value={item.status || "Confirmed"}
              valueClass={`${statusStyle.text} font-black`}
              isDark={isDark}
            />
          </div>
        </SectionCard>

        {/* Patient Info */}
        <SectionCard
          headerColor="cyan"
          headerIcon={User}
          headerLabel="Patient Information"
          isDark={isDark}
        >
          <div className="px-4 py-1">
            <InfoRow
              label="Patient ID"
              value={item.id ? `#${item.id}` : "—"}
              isDark={isDark}
            />
            <InfoRow label="Patient Name" value={userName} isDark={isDark} />
            <InfoRow label="Booking Date" value={bookingDate} isDark={isDark} />
            <InfoRow
              label="Booking Time"
              value={bookingTime || "—"}
              isDark={isDark}
            />
          </div>
        </SectionCard>

        {/* Notes */}
        <SectionCard
          headerColor="blue"
          headerIcon={FileText}
          headerLabel="Appointment Notes"
          isDark={isDark}
        >
          <div className="px-4 py-3">
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: isDark ? "#cbd5e1" : "#334155" }}
            >
              {item.notes ||
                "Please bring previous medical reports, valid ID proof, and arrive 10 minutes early for registration."}
            </p>
          </div>
        </SectionCard>

        {/* Reminder */}
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl"
          style={{
            background: isDark
              ? "rgba(16,185,129,0.05)"
              : "rgba(16,185,129,0.06)",
            border: isDark
              ? "1px solid rgba(16,185,129,0.15)"
              : "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <Info
            size={12}
            className={
              isDark
                ? "text-emerald-400 mt-0.5 shrink-0"
                : "text-emerald-500 mt-0.5 shrink-0"
            }
          />
          <p
            className="text-[10px] leading-relaxed"
            style={{
              color: isDark ? "rgba(52,211,153,0.8)" : "rgba(5,150,105,0.9)",
            }}
          >
            Please bring all previous reports and arrive 10 minutes early.
            Contact the hospital if you need to reschedule.
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCAN CARD
═══════════════════════════════════════════════════════════ */
function ScanCard({ item, onDelete, onView }) {
  const type = getActivityType(item);
  const meta = TYPE_META[type] || TYPE_META.symptom;
  const risk = getRisk(item.risk);
  const Icon = meta.icon;
  const { date, time } = formatDateTime(item);
  const confN = parseFloat((item.confidence || "0").replace("%", ""));

  return (
    <div
      className={`group ${cardCls} overflow-hidden transition-all duration-300 hover:border-cyan-400/30 hover:shadow-cyan-500/10 hover:shadow-2xl hover:-translate-y-0.5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5">
        {/* TOP ROW on mobile: icon + date + actions */}
        <div className="flex items-start justify-between sm:contents">
          {/* LEFT */}
          <div className="flex items-start gap-3 sm:w-52 shrink-0">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: meta.bg,
                border: `1px solid ${meta.border}`,
              }}
            >
              <Icon size={16} style={{ color: meta.color }} />
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                {meta.label}
              </p>
              <p className="text-[11px] sm:text-[12px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5 leading-tight">
                {date}
              </p>
              {time && (
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock size={8} /> {time}
                </p>
              )}
            </div>
          </div>

          {/* ACTIONS — visible on mobile in top-right */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              onClick={() => onView(item)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider
                text-white bg-linear-to-br from-cyan-600 via-cyan-500 to-indigo-700
                border border-white/20 active:scale-95 transition-all"
            >
              View <ChevronRight size={9} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="w-7 h-7 rounded-xl flex items-center justify-center
                text-slate-400 bg-white/20 dark:bg-slate-800/30 border border-white/20 dark:border-white/5
                hover:text-red-400 active:scale-95 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="hidden sm:block w-px h-10 bg-white/20 dark:bg-white/5 shrink-0" />

        {/* MIDDLE */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black border ${
                (item.result || "").toLowerCase() === "normal"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400"
              }`}
            >
              {item.result || "—"}
            </span>
            {item.risk && (
              <span
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold border ${risk.bg} ${risk.border} ${risk.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                {item.risk} Risk
              </span>
            )}
            {item.isEmergency && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black bg-red-600/10 border border-red-500/30 text-red-500 dark:text-red-400 uppercase tracking-wider">
                <AlertTriangle size={8} /> Emergency
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Confidence
            </span>
            <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${confN}%`,
                  background:
                    confN >= 80
                      ? "#10b981"
                      : confN >= 60
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              />
            </div>
            <span
              className={`text-[10px] sm:text-[11px] font-black shrink-0 ${confN >= 80 ? "text-emerald-500 dark:text-emerald-400" : confN >= 60 ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400"}`}
            >
              {item.confidence || "—"}
            </span>
          </div>

          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 truncate">
            <span className="text-cyan-400 font-semibold">AI:</span>{" "}
            {item.aiMode || item.assessmentType || "—"}
          </p>
        </div>

        {/* RIGHT ACTIONS — desktop only */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => onView(item)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider
              text-white bg-linear-to-br from-cyan-600 via-cyan-500 to-indigo-700
              border border-white/20 shadow-[0_4px_14px_-4px_rgba(139,92,246,0.5)]
              hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
          >
            View Details <ChevronRight size={11} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center
              text-slate-400 dark:text-slate-500
              bg-white/20 dark:bg-slate-800/30
              border border-white/20 dark:border-white/5
              hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5
              active:scale-95 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPOINTMENT CARD
═══════════════════════════════════════════════════════════ */
function AppointmentCard({ item, onDelete, onView }) {
  const meta = TYPE_META.appointment;
  const { date, time } = formatDateTime(item);
  const statusStyle =
    (item.status || "confirmed").toLowerCase() === "confirmed"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      : "bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400";

  return (
    <div
      className={`group ${cardCls} overflow-hidden transition-all duration-300 hover:border-emerald-400/30 hover:shadow-emerald-500/10 hover:shadow-2xl hover:-translate-y-0.5`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5">
        {/* TOP ROW on mobile */}
        <div className="flex items-start justify-between sm:contents">
          {/* LEFT */}
          <div className="flex items-start gap-3 sm:w-52 shrink-0">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: meta.bg,
                border: `1px solid ${meta.border}`,
              }}
            >
              <Calendar size={16} style={{ color: meta.color }} />
            </div>
            <div className="min-w-0">
              <p
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                Appointment Booked
              </p>
              <p className="text-[11px] sm:text-[12px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5 leading-tight">
                {date}
              </p>
              {time && (
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock size={8} /> {time}
                </p>
              )}
            </div>
          </div>

          {/* ACTIONS — mobile top-right */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              onClick={() => onView(item)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider
                text-white bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-600
                border border-white/20 active:scale-95 transition-all"
            >
              View <ChevronRight size={9} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="w-7 h-7 rounded-xl flex items-center justify-center
                text-slate-400 bg-white/20 dark:bg-slate-800/30 border border-white/20 dark:border-white/5
                hover:text-red-400 active:scale-95 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="hidden sm:block w-px h-10 bg-white/20 dark:bg-white/5 shrink-0" />

        {/* MIDDLE */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
            <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 dark:text-slate-200">
              {item.doctor || "—"}
            </span>
            <span
              className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold border ${statusStyle}`}
            >
              {item.status || "Confirmed"}
            </span>
          </div>
          {item.type && (
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Dept:</span>{" "}
              {item.type}
            </p>
          )}
          {item.hospital && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              <span className="text-emerald-400 font-semibold">Hospital:</span>{" "}
              {item.hospital}
            </p>
          )}
          {item.time && item.date && (
            <p className="text-[9px] sm:text-[10px] text-slate-400">
              <span className="text-emerald-400 font-semibold">Appt:</span>{" "}
              {item.date} · {item.time}
            </p>
          )}
        </div>

        {/* RIGHT ACTIONS — desktop */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => onView(item)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider
              text-white bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-600
              border border-white/20 shadow-[0_4px_14px_-4px_rgba(16,185,129,0.45)]
              hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
          >
            View Details <ChevronRight size={11} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center
              text-slate-400 dark:text-slate-500
              bg-white/20 dark:bg-slate-800/30
              border border-white/20 dark:border-white/5
              hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5
              active:scale-95 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════════ */
function EmptyState({ filter, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4 px-4">
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center"
        style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.15)",
        }}
      >
        <Clock size={28} className="text-cyan-400 opacity-60" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm text-center">
        No record found
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function History({ language = "en", onViewReport }) {
  const [scans, setScans] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [modalItem, setModalItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const deleteAppt = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`http://localhost:5001/appointments/${id}`, {
        method: "DELETE",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      setAppointments((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };
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

  const t = {
    en: {
      title: "History",
      subtitle: "Your medical activity timeline",
      empty: "No medical history available",
      searchPlaceholder: "Search history…",
    },
    bn: {
      title: "ইতিহাস",
      subtitle: "আপনার চিকিৎসা কার্যকলাপ",
      empty: "কোনো ইতিহাস নেই",
      searchPlaceholder: "খুঁজুন…",
    },
    hi: {
      title: "इतिहास",
      subtitle: "आपकी चिकित्सा गतिविधि",
      empty: "कोई इतिहास नहीं",
      searchPlaceholder: "खोजें…",
    },
  };
  const lang = t[language] || t.en;

  const openScanModal = (item) => {
    setModalItem(item);
    setModalType("scan");
  };
  const openApptModal = (item) => {
    setModalItem(item);
    setModalType("appointment");
  };
  const closeModal = () => {
    setModalItem(null);
    setModalType(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setLoading(true);
    Promise.allSettled([
      fetch("http://localhost:5001/reports", { headers }).then((r) => r.json()),
      fetch("http://localhost:5001/appointments", { headers }).then((r) =>
        r.json(),
      ),
    ])
      .then(([scanRes, apptRes]) => {
        if (scanRes.status === "fulfilled" && Array.isArray(scanRes.value))
          setScans([...scanRes.value].reverse());
        if (apptRes.status === "fulfilled" && Array.isArray(apptRes.value))
          setAppointments(
            apptRes.value.map((a) => ({
              ...a,
              type: a.type || "appointment",
              _isAppt: true,
            })),
          );
      })
      .finally(() => setLoading(false));
  }, []);

  const deleteScan = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:5001/reports/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    setScans((prev) => prev.filter((s) => s.id !== id));
  };

  const allItems = useMemo(() => {
    const merged = [
      ...scans.map((s) => ({ ...s, _kind: "scan" })),
      ...appointments.map((a) => ({
        ...a,
        _kind: "appointment",
        datetime: a.date && a.time ? `${a.date} ${a.time}` : a.date,
      })),
    ];
    return merged.sort((a, b) => {
      const da = new Date(a.datetime || a.date || 0);
      const db = new Date(b.datetime || b.date || 0);
      return db - da;
    });
  }, [scans, appointments]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (activeFilter === "Scans")
      items = items.filter((i) => i._kind === "scan");
    else if (activeFilter === "Appointments")
      items = items.filter((i) => i._kind === "appointment");
    else if (activeFilter === "X-Ray")
      items = items.filter(
        (i) => i._kind === "scan" && getActivityType(i) === "xray",
      );
    else if (activeFilter === "Symptom")
      items = items.filter(
        (i) => i._kind === "scan" && getActivityType(i) === "symptom",
      );
    else if (activeFilter === "Hybrid")
      items = items.filter(
        (i) => i._kind === "scan" && getActivityType(i) === "hybrid",
      );
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          (i.result || "").toLowerCase().includes(q) ||
          (i.risk || "").toLowerCase().includes(q) ||
          (i.aiMode || "").toLowerCase().includes(q) ||
          (i.doctor || "").toLowerCase().includes(q) ||
          (i.hospital || "").toLowerCase().includes(q) ||
          (i.type || "").toLowerCase().includes(q) ||
          (i.date || "").toLowerCase().includes(q),
      );
    }
    return items;
  }, [allItems, activeFilter, search]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  const FILTERS = [
    "All",
    "Scans",
    "Appointments",
    "X-Ray",
    "Symptom",
    "Hybrid",
  ];
  const counts = useMemo(
    () => ({
      All: allItems.length,
      Scans: allItems.filter((i) => i._kind === "scan").length,
      Appointments: allItems.filter((i) => i._kind === "appointment").length,
      "X-Ray": allItems.filter(
        (i) => i._kind === "scan" && getActivityType(i) === "xray",
      ).length,
      Symptom: allItems.filter(
        (i) => i._kind === "scan" && getActivityType(i) === "symptom",
      ).length,
      Hybrid: allItems.filter(
        (i) => i._kind === "scan" && getActivityType(i) === "hybrid",
      ).length,
    }),
    [allItems],
  );

  return (
    <div
      className="p-3 sm:p-4 md:p-6 lg:p-8 min-h-screen transition-all duration-300 text-black dark:text-white"
      style={isDark ? darkBg : lightBg}
    >
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .su   { animation: slideUp 0.38s cubic-bezier(.4,0,.2,1) both; }
        .su-1 { animation: slideUp 0.38s 60ms  cubic-bezier(.4,0,.2,1) both; }
        .su-2 { animation: slideUp 0.38s 120ms cubic-bezier(.4,0,.2,1) both; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      <div className="w-full space-y-4 sm:space-y-6">
        {/* HEADER */}
        <div className="su flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={24} className="text-cyan-500" />
            </div>
            <div>
              <h1
                className={`text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight ${gText}`}
              >
                {lang.title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                {lang.subtitle}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang.searchPlaceholder}
              className="w-full pl-8 pr-4 py-2 sm:py-2.5 rounded-xl text-[12px] font-medium
                bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl
                border border-white/40 dark:border-white/5
                text-slate-700 dark:text-slate-200 placeholder:text-slate-400
                focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* FILTER TABS — horizontally scrollable on mobile */}
        <div className="su-1">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            <Filter size={12} className="text-slate-400 shrink-0" />
            {FILTERS.map((f) => {
              const isActive = activeFilter === f;
              const cnt = counts[f] || 0;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                    isActive
                      ? "text-white bg-linear-to-br from-cyan-600 via-cyan-500 to-indigo-700 border-transparent shadow-[0_4px_14px_-4px_rgba(139,92,246,0.5)]"
                      : "text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-slate-900/20 border-white/30 dark:border-white/5 hover:border-cyan-400/40 hover:text-cyan-500"
                  }`}
                >
                  {f}
                  {cnt > 0 && (
                    <span
                      className={`px-1 sm:px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-cyan-500/10 text-cyan-500"
                      }`}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">
              Loading your history…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={activeFilter} t={lang} />
        ) : (
          <div className="su-2 space-y-6 sm:space-y-8">
            {Array.from(grouped.entries()).map(([month, items]) => (
              <div key={month} className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl"
                    style={{
                      background: "rgba(124,58,237,0.08)",
                      border: "1px solid rgba(124,58,237,0.15)",
                    }}
                  >
                    <Layers size={10} className="text-cyan-400" />
                    <span
                      className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${gText}`}
                    >
                      {month}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400/70">
                      ({items.length})
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-white/10 dark:bg-white/5" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {items.map((item) =>
                    item._kind === "appointment" ? (
                      <AppointmentCard
                        key={`appt-${item.id}`}
                        item={item}
                        onDelete={deleteAppt}
                        onView={openApptModal}
                      />
                    ) : (
                      <ScanCard
                        key={`scan-${item.id}`}
                        item={item}
                        onDelete={deleteScan}
                        onView={openScanModal}
                      />
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[9px] sm:text-[10px] text-slate-400/50 pb-2">
          MediScan AI · For clinical support only · Not a substitute for
          professional medical advice
        </p>
      </div>

      {/* MODALS */}
      {modalItem && modalType === "scan" && (
        <ScanModal item={modalItem} onClose={closeModal} isDark={isDark} />
      )}
      {modalItem && modalType === "appointment" && (
        <AppointmentModal
          item={modalItem}
          onClose={closeModal}
          isDark={isDark}
        />
      )}
    </div>
  );
}