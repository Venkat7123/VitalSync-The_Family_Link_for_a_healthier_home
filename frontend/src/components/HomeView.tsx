"use client";

import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { Pill, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi, getUser } from "@/lib/api";

export function HomeView() {
  const { userRole, medicines, setMedicines } = useAppContext();
  const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  const canLogProgress = userRole === "patient";

  const [greeting, setGreeting] = useState("Hello");
  const [currentPeriod, setCurrentPeriod] = useState<"morning" | "afternoon" | "evening" | "night">("morning");
  const [displayName, setDisplayName] = useState("there");

  useEffect(() => {
    // Defer state updates outside the effect body (eslint rule in this repo).
    const t = setTimeout(() => {
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

      const local = getUser() as { fullName?: string } | null;
      let name = local?.fullName?.trim() || "";

      if (userRole === "caregiver") {
        try {
          const stored = localStorage.getItem("vs_active_patient");
          const parsed = stored ? (JSON.parse(stored) as { patientName?: string } | null) : null;
          const pn = parsed?.patientName?.trim();
          if (pn) name = pn;
        } catch {}
      }

      const first = name.split(" ").filter(Boolean)[0];
      setDisplayName(first || (userRole === "caregiver" ? "Patient" : "there"));
    }, 0);
    return () => clearTimeout(t);
  }, [userRole]);

  const periodMeds = medicines.filter((m) => {
    if (m.sessions && m.sessions.length) return m.sessions.includes(currentPeriod);
    return m.period === currentPeriod;
  });
  const takenCount = medicines.filter(m => m.taken).length;
  const totalCount = medicines.length;
  const progressPct = totalCount ? Math.round((takenCount / totalCount) * 100) : 0;

  const handleMarkTaken = async (medId: string | number) => {
    if (!canLogProgress) return;

    // Optimistic: mark as taken locally.
    setMedicines((prev) => prev.map((m) => (m.id === medId ? { ...m, taken: true } : m)));
    try {
      await fetchApi(`/medications/${medId}/log`, { method: "POST" });
    } catch (err) {
      console.error("Failed to log medicine intake", err);
      // Revert if backend call fails.
      setMedicines((prev) => prev.map((m) => (m.id === medId ? { ...m, taken: false } : m)));
      alert("Failed to mark as taken. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-bold mb-2 tracking-tight">
          {greeting}, <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="text-muted text-lg">
          {userRole === "patient" 
            ? "Here is your health overview for today."
            : `Monitor ${displayName}'s health and medication status.`}
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
                      <p className="text-sm text-muted">
                        {med.dosage} - {med.sessions?.map((s) => titleCase(s)).join(", ") || med.time}
                      </p>
                    </div>
                  </div>

                  {canLogProgress ? (
                    <button
                      onClick={() => !med.taken && handleMarkTaken(med.id)}
                      disabled={med.taken}
                      className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        med.taken 
                          ? "bg-success/10 text-success border border-success/30 cursor-default" 
                          : "bg-primary text-white hover:bg-primary/90 glow-primary"
                      }`}
                    >
                      {med.taken ? "Completed" : "Mark as Taken"}
                    </button>
                  ) : null}
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
                animate={{ width: `${progressPct}%` }}
                className="h-full bg-primary glow-primary"
              />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-muted font-medium">{takenCount} of {totalCount} completed</span>
              <span className="text-primary font-bold">{progressPct}%</span>
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

      {userRole === "caregiver" ? null : null}
    </div>
  );
}
