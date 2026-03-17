"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileText, Activity, AlertTriangle, ShieldCheck, Camera, Calendar, Download, BarChart3, CheckCircle, X } from "lucide-react";
import { useAppContext, Report } from "@/context/AppContext";
import { useState } from "react";

export function IntelligenceView() {
  const { reports, setReports } = useAppContext();
  const [isScanning, setIsScanning] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const newReport: Report = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        type: "Complete Blood Count",
        status: "Analysis Complete",
        issues: 1,
        importantData: "Hemoglobin: 13.5 g/dL | WBC: 8.2 K/uL | Platelets: 150 K/uL | Iron: 45 ug/dL",
        insight: {
          type: "alert",
          message: "Iron levels are slightly below optimal range. Consider increasing dietary iron intake and consult your physician if you experience fatigue."
        }
      };
      
      setReports([newReport, ...reports]);
      setIsScanning(false);
      setActiveReport(newReport); // open modal right away
    }, 3000);
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

  const parseMetrics = (data: string) =>
    data
      .split(" | ")
      .map((dataPoint) => {
        const parts = dataPoint.split(": ");
        return { label: parts[0], value: parts[1] || "" };
      })
      .filter((item) => item.label);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-20 p-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">My Reports</h1>
          <p className="text-muted text-lg">Upload and view your detailed medical reports</p>
        </div>
        
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera className="w-6 h-6" /> {isScanning ? "Scanning..." : "Scan New Report"}
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Scan History</h2>

        {reports.length === 0 ? (
          <div className="bg-card border border-dashed border-card-border rounded-xl p-16 text-center shadow-sm">
            <FileText className="w-20 h-20 text-muted opacity-20 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-foreground mb-3">No Reports Yet</h3>
            <p className="text-muted mb-8 text-lg">Scan your first medical report to instantly receive AI-powered analysis.</p>
            <button
              onClick={handleScan}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
            >
              <Camera className="w-5 h-5" /> Start Scanning
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report)}
                className="group flex flex-col items-start justify-between text-left rounded-xl border border-card-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="w-full">
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
            ))}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {parseMetrics(activeReport.importantData).map((metric, idx) => {
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

      {/* Scanning Overlay */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-72 h-80 border-2 border-primary rounded-2xl overflow-hidden bg-surface shadow-2xl flex items-center justify-center"
            >
              <Camera className="w-20 h-20 text-primary opacity-20" />
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
              Analyzing Document...
            </motion.h3>
            <p className="text-muted text-lg mt-2 font-medium">Extracting vital biomarkers</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

