"use client";

import { motion } from "framer-motion";
import { Users, Activity, AlertCircle, FileDown, CheckCircle2, Clock, Pill, FileText } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useState, useEffect } from "react";

export function CaregiverHubView() {
  const { userRole, medicines, reports, setCurrentView } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert("PDF Report Generated Successfully!");
    }, 2000);
  };

  if (userRole !== "caregiver") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Users className="w-16 h-16 text-muted mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
        <p className="text-muted max-w-sm">This area is reserved for caregivers to monitor their assigned patients.</p>
      </div>
    );
  }

  const pendingMeds = medicines.filter(m => !m.taken);
  const totalMeds = medicines.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Caregiver Hub</h1>
          <p className="text-muted">Monitor Jane's activity and manage care.</p>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className={`flex items-center gap-2 btn-accessible px-6 py-3 rounded-xl w-auto transition-all ${
            isGenerating 
              ? "bg-surface text-muted cursor-wait"
              : "bg-surface hover:bg-primary/20 hover:text-primary border border-card-border"
          }`}
          style={{ minHeight: 'auto' }}
        >
           <FileDown className="w-5 h-5" />
           {isGenerating ? "Compiling..." : "Export Doctor's PDF"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient Status Overview */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold pl-2">Current Status</h2>
          <div className="glass-card p-6 border-t-4 border-t-accent flex flex-col items-center text-center">
             <div className="w-24 h-24 rounded-full bg-surface border-4 border-accent flex items-center justify-center mb-4 relative">
                <div className="absolute inset-0 rounded-full border border-accent animate-ping opacity-20"></div>
                <Activity className="w-10 h-10 text-accent" />
             </div>
             <h3 className="text-2xl font-bold mb-1">Jane Doe</h3>
             <p className="text-muted mb-4">Mother • Age 68</p>
             <div className={`px-4 py-1.5 rounded-full font-bold text-sm tracking-wide ${
               pendingMeds.length === 0 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
             }`}>
               STATUS: {pendingMeds.length === 0 ? 'STABLE' : 'ACTION REQUIRED'}
             </div>
          </div>

          <div className="glass-card p-5 mt-4 space-y-4">
             <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-card-border/30 pb-2">
               Snapshot
             </h3>
             <div className="flex justify-between items-center text-sm">
               <span className="text-muted">Meds Taken</span>
               <span className="font-semibold">{totalMeds - pendingMeds.length} / {totalMeds}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-muted">Pending Today</span>
               <span className="font-bold text-warning">{pendingMeds.length}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-muted">Last Scanned Report</span>
               <span className="font-semibold text-primary">{reports[0]?.date || 'N/A'}</span>
             </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setCurrentView('medicine')}
              className="glass-card p-6 hover:bg-primary/5 transition-all text-left flex items-start gap-4 border-primary/20"
            >
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Manage Medicines</h3>
                <p className="text-sm text-muted">Add or verify medications</p>
              </div>
            </button>
            <button 
              onClick={() => setCurrentView('intelligence')}
              className="glass-card p-6 hover:bg-accent/5 transition-all text-left flex items-start gap-4 border-accent/20"
            >
              <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">View Reports</h3>
                <p className="text-sm text-muted">Access AI-analyzed data</p>
              </div>
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted" />
              Pending Medications
            </h3>
            <div className="space-y-3">
              {pendingMeds.length > 0 ? (
                pendingMeds.map(med => (
                  <div key={med.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-card-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-warning/20 text-warning">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold">{med.name}</p>
                        <p className="text-xs text-muted">Scheduled for {med.time} ({med.period})</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-warning uppercase">PENDING</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                   <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2 opacity-30" />
                   <p className="text-muted">All medications for today have been completed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
