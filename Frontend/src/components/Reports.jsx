import React, { useEffect, useState } from "react";
import { Eye, Download, Trash2, FileText, User, X } from "lucide-react";
import { generateMediScanPDF } from "./pdfReportGenerator";

export default function Reports({ reports = [], language = "en" }) {
  const [data, setData] = useState(reports);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const lightBg = {
    background:
      "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
  };
  const darkBg = {
    background:
       "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
  };

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  const t = {
    en: {
      title: "Reports",
      view: "View",
      download: "Download",
      delete: "Delete",
      result: "Result",
      risk: "Risk",
      close: "Close",
      unknown: "Unknown",
      patient: "Patient",
      pdfTitle: "MediScan Report",
    },
    bn: {
      title: "রিপোর্ট",
      view: "দেখুন",
      download: "ডাউনলোড",
      delete: "মুছে ফেলুন",
      result: "ফলাফল",
      risk: "ঝুঁকি",
      close: "বন্ধ করুন",
      unknown: "অজানা",
      patient: "রোগী",
      pdfTitle: "মেডিস্ক্যান রিপোর্ট",
    },
    hi: {
      title: "रिपोर्ट",
      view: "देखें",
      download: "डाउनलोड",
      delete: "हटाएं",
      result: "परिणाम",
      risk: "जोखिम",
      close: "बंद करें",
      unknown: "अज्ञात",
      patient: "मरीज",
      pdfTitle: "मेडिस्कैन रिपोर्ट",
    },
  };

  const currentT = t[language] || t.en;

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5001/reports", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((resData) => {
        console.log("REPORTS DATA:", resData);
        if (Array.isArray(resData)) {
          setData(resData);
        } else {
          console.error("Reports Error:", resData);
          setData([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setData([]);
      });
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark")),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const formatDate = (dateStr) => {
    try {
      return new Intl.DateTimeFormat(
        language === "en" ? "en-US" : language === "bn" ? "bn-BD" : "hi-IN",
      ).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // ── Helper: display name for a report ────────────────────
  // Uses patientName from backend; falls back to translated "Unknown"
  const getDisplayName = (r) =>
    r.patientName && r.patientName.trim() !== ""
      ? r.patientName
      : currentT.unknown;

  // ── Helper: normalize a report row from the backend into the shape
  // that generateMediScanPDF (pdfReportGenerator.js) expects.
  // Backend rows may use snake_case (original_xray, gradcam, adv_symptoms,
  // etc.) while the PDF generator expects camelCase — this covers both so
  // the full detailed PDF renders correctly regardless of the API's naming.
  const buildPdfReportPayload = (r) => ({
    id: r.id,
    patientName: r.patientName || r.patient_name || getDisplayName(r),
    age: r.age ?? r.patientAge ?? r.patient_age,
    gender: r.gender ?? r.patientGender ?? r.patient_gender,
    datetime: r.datetime || r.timestamp || r.createdAt || r.created_at || r.date,
    date: r.date,
    assessmentType: r.assessmentType || r.assessment_type,
    result: r.result,
    risk: r.risk,
    confidence: r.confidence,
    reliability: r.reliability,
    aiMode: r.aiMode || r.ai_mode,
    probabilities: r.probabilities || r.disease_probabilities || [],
    symptoms: r.symptoms || [],
    symptomsDetailed: r.symptomsDetailed || r.symptoms_detailed || [],
    advSymptoms: r.advSymptoms || r.adv_symptoms || [],
    smokingHistory: r.smokingHistory || r.smoking_history,
    symptomDuration: r.symptomDuration || r.symptom_duration,
    xrayInterpretation: r.xrayInterpretation || r.xray_interpretation,
    recommendations: r.recommendations || [],
    originalXray: r.originalXray || r.original_xray || r.image,
    gradcam: r.gradcam || r.grad_cam,
  });

  const downloadReport = async (r) => {
    try {
      setDownloadingId(r.id);
      const payload = buildPdfReportPayload(r);
      await generateMediScanPDF(payload, {
        patientNameOverride: getDisplayName(r),
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate report PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteReport = async (id) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5001/reports/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setData((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(data.message || "Delete failed");
    }
  };

  return (
    <div
      className="p-4 md:p-8 min-h-screen transition-all duration-300 text-black dark:text-white"
      style={isDark ? darkBg : lightBg}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2 md:gap-3">
            <FileText className="text-cyan-700" size={28} />
            <span className="bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
              {currentT.title}
            </span>
          </h1>
        </div>

        {/* REPORT LIST */}
        <div className="grid gap-3 md:gap-4">
          {data.map((r) => (
            <div
              key={r.id}
              className="group p-4 md:p-5 bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center hover:border-cyan-500 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
                <div className="p-2.5 md:p-3 bg-cyan-200 dark:bg-cyan-800/20 rounded-full text-cyan-700 dark:text-cyan-500 shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* ✅ Patient name shown here */}
                  <p className="font-bold text-base md:text-lg tracking-tight bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
                    {getDisplayName(r)}
                  </p>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatDate(r.date)}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-500 font-medium">
                      {r.result}
                    </span>
                    <span>•</span>
                    <span
                      className={
                        r.risk?.toLowerCase() === "high"
                          ? "text-red-500"
                          : "text-orange-400"
                      }
                    >
                      {r.risk}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3 md:mt-0 w-full md:w-auto">
                <button
                  onClick={() => setSelectedReport(r)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg cursor-pointer transition-all duration-300 ease-out bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:bg-linear-to-br hover:from-cyan-500 hover:via-cyan-600 hover:to-cyan-700 hover:text-white hover:border-transparent hover:shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)] active:scale-95 active:brightness-90"
                >
                  <Eye size={16} />
                  {currentT.view}
                </button>
                <button
                  onClick={() => downloadReport(r)}
                  disabled={downloadingId === r.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg cursor-pointer transition-all duration-300 ease-out bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:bg-linear-to-r hover:from-emerald-500 hover:via-emerald-600 hover:to-teal-700 hover:text-white hover:border-transparent hover:shadow-[0_12px_25px_-4px_rgba(16,185,129,0.5)] hover:brightness-110 active:scale-95 active:translate-y-0.5 active:shadow-[0_4px_15px_-8px_rgba(16,185,129,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  {downloadingId === r.id ? "..." : currentT.download}
                </button>
                <button
                  onClick={() => deleteReport(r.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL — quick view stays lightweight (patient, result, risk, image) */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-3 md:p-4">
            <div className="bg-white dark:bg-[#162235] text-black dark:text-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-cyan-500/20 transition-all duration-300">
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                  <FileText className="text-cyan-500" />
                  <span className="bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
                    {currentT.pdfTitle}
                  </span>
                </h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  {[
                    {
                      label: currentT.patient,
                      value: getDisplayName(selectedReport), // ✅ patient name in modal
                      cls: "",
                    },
                    {
                      label: currentT.result,
                      value: selectedReport.result,
                      cls: "text-emerald-600 font-semibold",
                    },
                    {
                      label: currentT.risk,
                      value: selectedReport.risk,
                      cls: "",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-800/50"
                    >
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {row.label}
                      </span>
                      <span className={`font-semibold text-sm ${row.cls}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  {selectedReport.image && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800">
                      <img
                        src={selectedReport.image}
                        className="w-full h-auto"
                        alt="Report"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => downloadReport(selectedReport)}
                  disabled={downloadingId === selectedReport.id}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white py-3 mt-4 rounded-xl font-bold transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  {downloadingId === selectedReport.id
                    ? "..."
                    : currentT.download}
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 py-3 mt-2 rounded-xl font-bold transition-colors text-sm"
                >
                  {currentT.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}