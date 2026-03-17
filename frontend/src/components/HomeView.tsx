"use client";

import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { Pill, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function HomeView() {
  const { userRole, medicines, setMedicines } = useAppContext();
  const [greeting, setGreeting] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState<"morning" | "afternoon" | "evening" | "night">("morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
      setCurrentPeriod("morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
      setCurrentPeriod("afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
      setCurrentPeriod("evening");
    } else {
      setGreeting("Good Night");
      setCurrentPeriod("night");
    }
  }, []);

  const periodMeds = medicines.filter(m => m.period === currentPeriod);
  const takenCount = medicines.filter(m => m.taken).length;
  const totalCount = medicines.length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">
          {greeting}, <span className="gradient-text">Jane</span>
        </h1>
        <p className="text-muted text-lg">
          {userRole === "patient" 
            ? "Here is your health overview for today."
            : "Monitor Jane's health and medication status."
          }
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medicine Overview Card */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              {currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1)} Medications
            </h2>
            <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
              Current
            </span>
          </div>

          <div className="space-y-3 mt-2">
            {periodMeds.length > 0 ? (
              periodMeds.map((med) => (
                <div key={med.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface rounded-xl border border-card-border/50 transition-colors hover:border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${med.taken ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      {med.taken ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-base">{med.name}</p>
                      <p className="text-sm text-muted">{med.dosage} • {med.time}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => userRole === 'patient' && setMedicines(medicines.map(m => m.id === med.id ? { ...m, taken: !m.taken } : m))}
                    disabled={userRole !== 'patient'}
                    className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      med.taken 
                        ? "bg-success/10 text-success hover:bg-success/20 border border-success/30" 
                        : "bg-primary text-white hover:bg-primary/90 glow-primary"
                    }`}
                  >
                    {med.taken ? "Completed" : "Mark as Taken"}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-muted text-center py-4">No medications scheduled for this period.</p>
            )}
          </div>
        </div>

        {/* Daily Progress Tracker */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">Daily Progress</h2>
            <div className="w-full h-4 bg-surface rounded-full overflow-hidden border border-card-border/30">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(takenCount / totalCount) * 100}%` }}
                className="h-full bg-primary glow-primary"
              />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-muted font-medium">{takenCount} of {totalCount} completed</span>
              <span className="text-primary font-bold">{Math.round((takenCount / totalCount) * 100)}%</span>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <AlertCircle className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm leading-snug">
              {takenCount === totalCount 
                ? "Perfect! All medications for today have been logged." 
                : `You have ${totalCount - takenCount} more medications to take today.`}
            </p>
          </div>
        </div>
      </div>

      {userRole === "caregiver" && (
        <div className="glass-card p-6">
           <h2 className="text-xl font-semibold mb-4">Caregiver Quick Actions</h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface hover:bg-primary/10 transition-colors border border-card-border/50">
                <Pill className="w-6 h-6 text-primary" />
                <span className="text-xs font-semibold">Verify Meds</span>
              </button>
              {/* Add more caregiver specific quick actions here */}
           </div>
        </div>
      )}
    </div>
  );
}
