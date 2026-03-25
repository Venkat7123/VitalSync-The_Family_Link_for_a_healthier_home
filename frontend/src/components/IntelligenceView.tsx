"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileText, Activity, AlertTriangle, ShieldCheck, Calendar, Download, CheckCircle, X, Upload, File } from "lucide-react";
import { useAppContext, Report } from "@/context/AppContext";
import { useState, useRef, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export function IntelligenceView() {
  const { reports, setReports } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const data = await fetchApi("/reports");
        if (data && Array.isArray(data)) {
          const mapped = data.map((item: unknown) => mapBackendToReport(item as Record<string, unknown>));
          setReports(mapped);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, [setReports]);

  const mapBackendToReport = (d: Record<string, unknown>): Report => {
    const extractedMetrics = typeof d.extractedMetrics === "string" ? d.extractedMetrics : "";
    const rawExtractedText = typeof d.rawExtractedText === "string" ? d.rawExtractedText : "";

    return ({
      id: Number(d.id),
      date: new Date(String(d.uploadedAt)).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      type: (typeof d.fileType === "string" && d.fileType) ? d.fileType : "Medical Document",
      status: "Analysis Complete",
      issues: d.criticalFlagged ? 1 : 0,
      importantData: extractedMetrics || rawExtractedText?.substring(0, 120) || "No metrics extracted",
      fileUrl: typeof d.fileUrl === "string" ? d.fileUrl : undefined,
      extractedMetrics: extractedMetrics || undefined,
      rawExtractedText: rawExtractedText || undefined,
      insight: {
        type: d.criticalFlagged ? "alert" : "stable",
        message: (typeof d.geminiSummary === "string" && d.geminiSummary) ||
          (typeof d.hfAnalysis === "string" && d.hfAnalysis) ||
          "No AI insights generated yet."
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const responseData = await fetchApi("/reports/upload", {
          method: "POST",
          body: formData
        });
        const newReport = mapBackendToReport(responseData as Record<string, unknown>);
        setReports([newReport, ...reports]);
        setActiveReport(newReport);
      } catch (err) {
        console.error("Failed to upload report:", err);
        alert("Upload failed. Ensure you chose a valid image or PDF.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleExport = (report: Report) => {
    const content = `Report: ${report.type}\nDate: ${report.date}\nStatus: ${report.status}\n\nBiomarkers:\n${report.importantData}\n\nInsight: ${report.insight?.message}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.date}.txt`;
    a.click();
  };

  const parseMetrics = (data: string) => {
    const text = (data || "").trim();
    if (!text) return [];

    if (text.startsWith("{") || text.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(text);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return Object.entries(parsed as Record<string, unknown>)
            .map(([label, value]) => ({ label, value: String(value ?? "") }))
            .filter((item) => item.label && item.value);
        }
      } catch {
        // Fall through to legacy parsing
      }
    }

    if (text.includes(" | ") || text.includes("|")) {
      return text
        .split(" | ")
        .map((dataPoint) => {
          const parts = dataPoint.split(": ");
          return { label: parts[0]?.trim() || "Item", value: parts[1]?.trim() || "" };
        })
        .filter((item) => item.label && item.value);
    }

    return [{ label: "Raw", value: text }];
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-20 p-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">My Reports</h1>
          <p className="text-muted text-lg">Upload and view your detailed medical reports</p>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-6 h-6" /> {isUploading ? "Processing..." : "Choose Report File"}
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Scan History</h2>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-card border border-dashed border-card-border rounded-xl p-16 text-center shadow-sm">
            <FileText className="w-20 h-20 text-muted opacity-20 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-foreground mb-3">No Reports Yet</h3>
            <p className="text-muted mb-8 text-lg">Scan your first medical report to instantly receive AI-powered analysis.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              <Upload className="w-5 h-5" /> Choose File
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg,.webp" 
              onChange={handleFileUpload} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const fileType = (report.type || "").toLowerCase();
              const isPdf = fileType.includes("pdf");

              return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report)}
                className="group flex flex-col items-start justify-between text-left rounded-xl border border-card-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="w-full">
                  {report.fileUrl && (
                    <div className="mb-4 w-full overflow-hidden rounded-xl border border-card-border bg-surface aspect-[4/3]">
                      {isPdf ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-2">
                          <FileText className="w-10 h-10 opacity-60" />
                          <span className="text-xs font-semibold tracking-wider uppercase">PDF</span>
                        </div>
                      ) : (
                        <img
                          src={report.fileUrl}
                          alt="Uploaded report"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    {report.insight?.type === "alert" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-danger bg-danger/10 px-2.5 py-1 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" /> Alert
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1 line-clamp-1">{report.type}</h3>
                  <p className="text-sm text-muted flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4" /> {report.date}
                  </p>
                </div>
                
                <div className="w-full pt-4 border-t border-card-border flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted font-medium">
                    <CheckCircle className="w-4 h-4 text-success" /> Status Complete
                  </span>
                  <span className="text-primary font-semibold group-hover:underline">View Detail &rarr;</span>
                </div>
              </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      <AnimatePresence>
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-card-border rounded-2xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveReport(null)}
                className="absolute top-6 right-6 p-2 bg-surface hover:bg-surface/80 rounded-full text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 pr-12">
                <span className="inline-flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-full text-muted text-sm font-medium mb-4">
                  <Calendar className="w-4 h-4" /> {activeReport.date}
                </span>
                <h2 className="text-2xl font-bold text-foreground mb-2">{activeReport.type}</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-success font-medium">
                    <CheckCircle className="w-4 h-4" /> {activeReport.status}
                  </span>
                </div>
              </div>

	              <div className="space-y-8">
	                {/* Report Preview */}
	                {activeReport.fileUrl && (
	                  <div>
	                    <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
	                      Report Image
	                    </h3>
	                    <button
	                      type="button"
	                      onClick={() => setIsPreviewOpen(true)}
	                      className="w-full overflow-hidden rounded-xl border border-card-border bg-surface text-left hover:border-primary/40 transition-colors"
	                      title="Click to enlarge"
	                    >
	                      {activeReport.type.toLowerCase().includes("pdf") ? (
	                        <div className="w-full h-64 flex items-center justify-center text-muted gap-3">
	                          <FileText className="w-8 h-8 opacity-60" />
	                          <span className="font-semibold">Open PDF Preview</span>
	                        </div>
	                      ) : (
	                        <img
	                          src={activeReport.fileUrl}
	                          alt="Uploaded report preview"
	                          className="w-full h-64 object-cover"
	                        />
	                      )}
	                    </button>
	                    <p className="text-xs text-muted mt-2">Click the preview to enlarge.</p>
	                  </div>
	                )}

	                {/* AI Explanation Section */}
	                <div>
                  <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> AI Detailed Explanation
                  </h3>
                  <div className={`p-5 rounded-xl border ${
                    activeReport.insight?.type === "alert"
                      ? "bg-danger/5 border-danger/30"
                      : "bg-success/5 border-success/30"
                  }`}>
                    <div className="flex items-start gap-4">
                      {activeReport.insight?.type === "alert" ? (
                        <div className="bg-danger/10 p-2 rounded-lg text-danger mt-1">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="bg-success/10 p-2 rounded-lg text-success mt-1">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className={`font-bold mb-2 ${
                          activeReport.insight?.type === "alert" ? "text-danger" : "text-success"
                        }`}>
                          {activeReport.insight?.type === "alert" ? "Attention Required" : "Good Progress"}
                        </p>
                        <p className="text-foreground leading-relaxed">
                          {activeReport.insight?.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extracted Data Section */}
	                <div>
	                  <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-3">
	                    Extracted Biomarkers
	                  </h3>
	                  {(() => {
	                    const metrics = parseMetrics(activeReport.extractedMetrics || activeReport.importantData);
	                    if (metrics.length === 0) {
	                      return <p className="text-sm text-muted">No biomarkers extracted for this report.</p>;
	                    }
	                    return (
	                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
	                        {metrics.map((metric, idx) => {
	                          const isWarning = metric.label.includes("Iron") && metric.value.includes("45");
	                          return (
	                            <div
	                              key={idx}
	                              className={`flex flex-col justify-center rounded-lg border px-4 py-3 ${
	                                isWarning ? "bg-warning/5 border-warning/30" : "bg-surface border-card-border"
	                              }`}
	                            >
	                              <span className="text-xs text-muted font-medium mb-1">{metric.label}</span>
	                              <span className={`text-lg font-bold ${isWarning ? "text-warning" : "text-foreground"}`}>
	                                {metric.value}
	                              </span>
	                            </div>
	                          );
	                        })}
	                      </div>
	                    );
	                  })()}
	                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-card-border flex justify-end gap-3">
                <button
                  onClick={() => handleExport(activeReport)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-surface hover:bg-surface/80 border border-card-border rounded-lg text-foreground font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Full PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden file input used by report upload buttons */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf,.png,.jpg,.jpeg,.webp" 
        onChange={handleFileUpload} 
      />

      {/* Scanning Overlay */}
      <AnimatePresence>
        {isUploading && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-72 h-80 border-2 border-primary rounded-2xl overflow-hidden bg-surface shadow-2xl flex items-center justify-center"
            >
              <File className="w-20 h-20 text-primary opacity-20" />
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]"
                animate={{ y: [0, 320, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            <motion.h3
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-2xl font-bold text-foreground mt-8 text-center"
            >
              Uploading Document...
            </motion.h3>
            <p className="text-muted text-lg mt-2 font-medium">Extracting vital biomarkers</p>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {activeReport?.fileUrl && isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-5xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute -top-3 -right-3 p-2 rounded-full bg-surface border border-card-border text-muted hover:bg-surface/80 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {activeReport.type.toLowerCase().includes("pdf") ? (
                <div className="w-full h-[80vh] rounded-xl overflow-hidden border border-white/10 bg-black">
                  <iframe
                    src={activeReport.fileUrl}
                    title="Report PDF"
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <img
                  src={activeReport.fileUrl}
                  alt="Full report preview"
                  className="w-full max-h-[80vh] object-contain rounded-xl border border-white/10 bg-black"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
