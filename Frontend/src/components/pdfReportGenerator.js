// src/components/pdfReportGenerator.js
import jsPDF from "jspdf";

/* Helper: load an image (base64 or url) and get its natural dimensions */
function getImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

/* Helper: detect image format from base64 data URL */
function getImageFormat(src) {
  if (!src) return "JPEG";
  if (src.includes("image/png")) return "PNG";
  if (src.includes("image/webp")) return "WEBP";
  return "JPEG";
}

/* Helper: build an exact date+time string including seconds. */
function getExactDateTime(report) {
  const raw = report.datetime || report.timestamp || report.createdAt;
  let d = raw ? new Date(raw) : null;
  if (!d || isNaN(d)) {
    d = report.date ? new Date(report.date) : new Date();
    if (isNaN(d)) d = new Date();
  }
  const datePart = d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}

export async function generateMediScanPDF(report, options = {}) {
  const patientName =
    options.patientNameOverride ||
    report.patientName ||
    report.name ||
    "Patient";
  const patientAge = report.age || options.ageOverride || "—";
  const patientGender = report.gender || options.genderOverride || "—";
  const exactDateTime = getExactDateTime(report);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const pageMargin = 24;
  const margin = pageMargin + 18;

  const hasXray = !!report.originalXray;
  const hasGradcam = !!report.gradcam;
  const showImageColumn = hasXray || hasGradcam;

  const imageColW = 190;
  const textColW = showImageColumn
    ? pageWidth - margin * 2 - imageColW - 20
    : pageWidth - margin * 2;

  let yLeft = 50;
  let yRight = 50;

  const cyan = [6, 182, 212];
  const gray = [100, 116, 139];
  const red = [220, 38, 38];

  /* ── Decorative border frame ── */
  const drawPageBorder = () => {
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(1.2);
    doc.roundedRect(
      pageMargin,
      pageMargin,
      pageWidth - pageMargin * 2,
      pageHeight - pageMargin * 2,
      6,
      6,
      "S"
    );
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(
      pageMargin + 5,
      pageMargin + 5,
      pageWidth - (pageMargin + 5) * 2,
      pageHeight - (pageMargin + 5) * 2,
      4,
      4,
      "S"
    );
  };
  drawPageBorder();

  /* ── Left column text helpers ── */
  const checkPageBreakLeft = (needed = 40) => {
    if (yLeft + needed > pageHeight - margin) {
      doc.addPage();
      drawPageBorder();
      yLeft = 50;
      yRight = 50;
    }
  };

  const heading = (text, size = 14) => {
    checkPageBreakLeft(size + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...cyan);
    doc.text(text, margin, yLeft);
    yLeft += size + 8;
  };

  const line = (label, value) => {
    checkPageBreakLeft(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(label.toUpperCase(), margin, yLeft);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const valWrapped = doc.splitTextToSize(String(value ?? "—"), textColW - 150);
    doc.text(valWrapped, margin + 150, yLeft);
    yLeft += Math.max(16, valWrapped.length * 12);
  };

  const paragraph = (text, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(60, 60, 60);
    const wrapped = doc.splitTextToSize(text, textColW);
    checkPageBreakLeft(wrapped.length * (size + 3) + 10);
    doc.text(wrapped, margin, yLeft);
    yLeft += wrapped.length * (size + 3) + 6;
  };

  const bulletList = (items, size = 10) => {
    items.forEach((item) => paragraph(`• ${item}`, size));
  };

  /* ── Right column: image box ── */
  const rightColX = margin + textColW + 20;

  const drawImageBox = async (src, label) => {
    if (!src) return;
    const boxW = imageColW;
    const boxH = 150;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const textW = doc.getTextWidth(label);
    const chipW = Math.min(boxW, textW + 16);
    const chipH = 18;

    doc.setFillColor(...cyan);
    doc.roundedRect(rightColX, yRight, chipW, chipH, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(label, rightColX + 8, yRight + 12);
    yRight += chipH + 6;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.rect(rightColX, yRight, boxW, boxH);

    try {
      const { width, height } = await getImageDimensions(src);
      const ratio = Math.min(boxW / width, boxH / height);
      const drawW = width * ratio;
      const drawH = height * ratio;
      const offsetX = rightColX + (boxW - drawW) / 2;
      const offsetY = yRight + (boxH - drawH) / 2;
      const format = getImageFormat(src);
      doc.addImage(src, format, offsetX, offsetY, drawW, drawH);
    } catch (e) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text("Image unavailable", rightColX + 10, yRight + boxH / 2);
    }

    yRight += boxH + 20;
  };

  /* ═══ HEADER ═══ */
  doc.setFillColor(...cyan);
  doc.rect(pageMargin, pageMargin, pageWidth - pageMargin * 2, 6, "F");
  yLeft = pageMargin + 26;
  heading("MediScan AI — Diagnosis Report", 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} · ${new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })}`,
    margin,
    yLeft
  );
  yLeft += 20;
  yRight = yLeft;

  /* ═══ RIGHT COLUMN — X-Ray + Grad-CAM ═══ */
  if (hasXray) await drawImageBox(report.originalXray, "X-RAY IMAGE");
  if (hasGradcam) await drawImageBox(report.gradcam, "GRAD-CAM HEATMAP");

  /* ═══ LEFT COLUMN ═══ */
  heading("Patient Information", 12);
  line("Patient Name", patientName);
  line("Age", patientAge);
  line("Gender", patientGender);
  line("Scan ID", report.id ? `#${report.id}` : "—");
  line("Date & Time", exactDateTime);
  line("Assessment Type", report.assessmentType || "—");
  yLeft += 8;

  heading("Primary Diagnosis", 12);
  line("Result", report.result || "—");
  line("Risk Level", report.risk || "—");
  line("Confidence", report.confidence || "—");
  line("Reliability", report.reliability || "—");
  line("AI Engine", report.aiMode || "—");
  yLeft += 8;

  if ((report.probabilities || []).length > 0) {
    heading("Disease Probabilities", 12);
    report.probabilities.forEach((p) => line(p.disease, `${p.pct}%`));
    yLeft += 8;
  }

  /* ── Submitted Symptoms — prefer detailed (with severity) if present ── */
  const symptomLines =
    (report.symptomsDetailed && report.symptomsDetailed.length > 0
      ? report.symptomsDetailed
      : report.symptoms) || [];
  if (symptomLines.length > 0) {
    heading("Submitted Symptoms", 12);
    bulletList(symptomLines);
    yLeft += 4;
  }

  if ((report.advSymptoms || []).length > 0) {
    heading("Additional Indicators (AI Follow-up Answers)", 12);
    bulletList(report.advSymptoms);
    yLeft += 4;
  }

  /* ── Lifestyle & Duration — smoking history + symptom duration ── */
  if (report.smokingHistory || report.symptomDuration) {
    heading("Lifestyle & Duration", 12);
    if (report.smokingHistory) line("Smoking History", report.smokingHistory);
    if (report.symptomDuration) line("Symptom Duration", report.symptomDuration);
    yLeft += 8;
  }

  if (report.xrayInterpretation) {
    heading("X-Ray Interpretation", 12);
    paragraph(report.xrayInterpretation);
  }

  if ((report.recommendations || []).length > 0) {
    heading("Recommendations", 12);
    bulletList(report.recommendations);
  }

  /* ── ✅ REMOVED: "Input Warnings" section ──
     Previously this block printed report.warnings (including the
     ampersand-mangled duration-contradiction text) into the PDF.
     Per request, this is no longer rendered in the downloaded PDF.
     Warnings still show on the in-app report page (ReportDetails.js
     "Reliability & Quality" card) — only the PDF output is affected. ── */

  /* ═══ Disclaimer — full width, below both columns ═══
     ✅ FIX: previously this used a fixed "needed height" of 60pt plus a
     flat +10pt gap before checking whether it fit on the current page.
     That overestimated the required space in many cases and forced the
     disclaimer onto a fresh page even when there was plenty of room left
     on the current one — leaving that new page almost empty.
     Now we:
       1) Compute the ACTUAL wrapped disclaimer text first, so we know its
          real height instead of guessing.
       2) Use a tighter, more accurate gap before the fit-check.
       3) Only start a new page if it truly won't fit — using the real
          usable bottom of the page (pageHeight - pageMargin - small pad),
          not the more conservative "margin" (which also includes the
          horizontal text margin and was cutting off usable vertical space).
  ── */
  const fullW = pageWidth - margin * 2;
  const disclaimerText =
    "This report is AI-generated and intended for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. Please consult a qualified and licensed medical professional before making any health decisions.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const disclaimerWrapped = doc.splitTextToSize(disclaimerText, fullW - 16);
  const disclaimerBoxH = Math.max(50, 30 + disclaimerWrapped.length * 11);

  let y = Math.max(yLeft, yRight) + 6; // tighter gap (was +10)
  const usablePageBottom = pageHeight - pageMargin - 10; // real usable bottom

  if (y + disclaimerBoxH > usablePageBottom) {
    doc.addPage();
    drawPageBorder();
    y = 50;
  }

  doc.setDrawColor(...red);
  doc.setFillColor(254, 242, 242);
  doc.rect(margin, y, fullW, disclaimerBoxH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...red);
  doc.text("Medical Disclaimer", margin + 8, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(disclaimerWrapped, margin + 8, y + 30);

  const filename = `MediScan_Report_${report.id || "latest"}.pdf`;
  doc.save(filename);
  return true;
}