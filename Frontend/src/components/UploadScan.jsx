import { useState } from "react";
import {
  UploadCloud,
  FileImage,
  Trash2,
  ShieldAlert,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function UploadScan({ darkMode, language = "en" }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // সায়ান থিমের সাথে ম্যাচিং লাইট ও ডার্ক ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট
  const lightBg = {
    background:
      "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
  };
  const darkBg = {
    background:
      "linear-gradient(135deg, #0d1117 0%, #081e26 40%, #052e3d 70%, #0d1117 100%)",
  };

  const t = {
    en: {
      title: "Upload Scan",
      subtitle: "Upload your lung scan image for AI analysis.",
      upload: "Upload & Analyze",
      remove: "Remove File",
      choose: "Choose File",
      drop: "Drag & Drop your scan here",
    },
    bn: {
      title: "স্ক্যান আপলোড করুন",
      subtitle: "AI বিশ্লেষণের জন্য আপনার স্ক্যান আপলোড করুন।",
      upload: "আপলোড করুন",
      remove: "ফাইল মুছুন",
      choose: "ফাইল নির্বাচন করুন",
      drop: "এখানে ফাইল ড্রপ করুন",
    },
    hi: {
      title: "स्कैन अपलोड करें",
      subtitle: "AI विश्लेषण के लिए स्कैन अपलोड करें।",
      upload: "अपलोड करें",
      remove: "हटाएं",
      choose: "फ़ाइल चुनें",
      drop: "यहाँ ड्रैग करें",
    },
  };

  const currentT = t[language] || t.en;

  const handleFile = (selected) => {
    setFile(selected);
    if (selected && selected.type.startsWith("image")) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const analyzeScan = async () => {
    if (!file) return alert("Select file first");
    loading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("http://localhost:5001/analyze-image", {
        method: "POST",
        body: formData,
      });
      const ai = await res.json();

      let resultValue = "Unknown",
        riskValue = "Unknown",
        confidenceValue = "AI-based";
      if (ai.result && typeof ai.confidence !== "undefined") {
        resultValue = ai.result;
        if (ai.confidence > 0.7) riskValue = "High";
        else if (ai.confidence > 0.4) riskValue = "Medium";
        else riskValue = "Low";
        confidenceValue = `${(ai.confidence * 100).toFixed(1)}%`;
      } else {
        const aiText = ai.result || "";
        const resultMatch = aiText.match(/Result:\s*(.*)/i);
        const riskMatch = aiText.match(/Risk:\s*(.*)/i);
        resultValue = resultMatch ? resultMatch[1] : "Unknown";
        riskValue = riskMatch ? riskMatch[1] : "Unknown";
      }

      await fetch("http://localhost:5001/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Patient",
          result: resultValue,
          risk: riskValue,
          confidence: confidenceValue,
          fileUrl: "",
          date: new Date().toISOString(),
        }),
      });

      alert("✅ AI Diagnosis Done");
    } catch (err) {
      console.error(err);
      alert("❌ Failed");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (!risk) return "text-gray-400";
    if (risk.toLowerCase().includes("high")) return "text-red-500";
    if (risk.toLowerCase().includes("low")) return "text-green-500";
    return "text-yellow-500";
  };

  return (
    <div
      className="p-4 md:p-8 min-h-screen transition-all duration-300 text-black dark:text-white"
      style={darkMode ? darkBg : lightBg}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <UploadCloud className="text-cyan-500 dark:text-cyan-400" size={28} />
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          <span className="bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
            {currentT.title}
          </span>
        </h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`relative p-6 md:p-10 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center
            ${file ? "border-cyan-500 bg-cyan-500/5" : "border-gray-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-cyan-500"}
          `}
        >
          {!preview ? (
            <>
              {/* আইকন সার্কেল গ্লো */}
              <div className="p-4 font-semibold rounded-full bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/20 mb-4">
                <FileImage size={36} />
              </div>
              <h2 className="text-lg md:text-xl font-semibold mb-2">
                <span className="bg-linear-to-r from-cyan-600 via-cyan-500 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-100 dark:via-white dark:to-cyan-300 dark:drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]">
                  {currentT.subtitle}
                </span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm md:text-base">
                {currentT.drop}
              </p>
            </>
          ) : (
            <div className="mb-6 group relative">
              <img
                src={preview}
                className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-xl border-4 border-white dark:border-slate-800 shadow-2xl"
                alt="Preview"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <CheckCircle className="text-white" size={48} />
              </div>
            </div>
          )}

          {/* ফাইল সিলেক্ট বাটন */}
          <label className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 font-bold text-sm tracking-wide cursor-pointer text-white dark:text-gray-100 bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 border border-white/20 dark:border-white/10 rounded-xl shadow-[0_10px_25px_-5px_rgba(6,182,212,0.4)] transition-all duration-300 ease-out hover:shadow-[0_15px_30px_-5px_rgba(6,182,212,0.6)] hover:brightness-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0.5 active:shadow-[0_5px_15px_-10px_rgba(6,182,212,0.3)]">
            {currentT.choose}
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </label>

          {file && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-cyan-600 dark:text-cyan-400 font-medium text-sm flex items-center gap-2">
                <FileImage size={16} />{" "}
                <span className="truncate max-w-48">{file.name}</span>
              </p>
              <p
                className={`${getRiskColor("Medium")} text-xs font-semibold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider`}
              >
                <ShieldAlert size={14} /> Risk Preview: Waiting for AI...
              </p>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6 md:mt-8 justify-center">
          {/* অ্যানালাইসিস বাটন */}
          <button
            onClick={analyzeScan}
            disabled={!file || loading}
            className={`flex items-center justify-center gap-2 px-6 md:px-8 py-3 rounded-xl font-bold transition-all shadow-lg
              ${
                !file || loading
                  ? "cursor-not-allowed bg-gray-200 dark:bg-slate-800/50 text-gray-400 dark:text-slate-600 border border-transparent font-bold shadow-none transition-all"
                  : "flex items-center gap-2 px-6 py-3 font-bold text-white cursor-pointer bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 border border-white/10 rounded-xl shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)] transition-all duration-300 hover:shadow-[0_12px_25px_-4px_rgba(6,182,212,0.6)] hover:brightness-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0.5 active:shadow-[0_4px_15px_-8px_rgba(6,182,212,0.4)]"
              }
            `}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <UploadCloud size={20} />
            )}
            {loading ? "Processing..." : currentT.upload}
          </button>

          {file && !loading && (
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 font-semibold text-sm tracking-wide cursor-pointer text-white dark:text-gray-100 bg-linear-to-br from-red-500 via-rose-600 to-red-800 border border-white/20 rounded-xl shadow-[0_8px_20px_-6px_rgba(220,38,38,0.5)] transition-all duration-300 ease-in-out hover:shadow-[0_12px_25px_-4px_rgba(220,38,38,0.6)] hover:brightness-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0.5 active:shadow-[0_4px_15px_-8px_rgba(220,38,38,0.4)]"
            >
              <Trash2 size={20} strokeWidth={2.5} />
              {currentT.remove}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
