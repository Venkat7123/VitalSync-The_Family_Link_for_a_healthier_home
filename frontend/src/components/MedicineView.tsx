"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Pill, Clock, Upload, PlusCircle, X, File, Pencil, Trash2 } from "lucide-react";
import { useAppContext, Medicine } from "@/context/AppContext";
import { useState, useRef, useEffect } from "react";
import { fetchApi } from "@/lib/api";

const SESSION_OPTIONS: Array<Medicine["period"]> = ["morning", "afternoon", "evening", "night"];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFoodGuidance(
  foodRelation: Medicine["foodRelation"],
  foodOffsetMinutes?: number
) {
  if (!foodRelation || foodRelation === "anytime") return "Anytime";
  const timing = foodOffsetMinutes && foodOffsetMinutes > 0 ? ` (${foodOffsetMinutes} min)` : "";
  if (foodRelation === "before_food") return `Before food${timing}`;
  if (foodRelation === "after_food") return `After food${timing}`;
  return "With food";
}

function parseFoodAndDaysFromInstructions(instructions: string): Pick<
  Medicine,
  "foodRelation" | "foodOffsetMinutes" | "days"
> {
  const result: Pick<Medicine, "foodRelation" | "foodOffsetMinutes" | "days"> = {};

  const text = (instructions || "").trim();
  if (!text) return result;

  const beforeMatch = text.match(/Before food(?:\s*\((\d+)\s*min\))?/i);
  const afterMatch = text.match(/After food(?:\s*\((\d+)\s*min\))?/i);
  const withMatch = text.match(/With food/i);
  const anytimeMatch = text.match(/^Anytime\b/i);
  const durationMatch = text.match(/Duration:\s*(\d+)\s*day/i);

  if (beforeMatch) {
    result.foodRelation = "before_food";
    if (beforeMatch[1]) result.foodOffsetMinutes = Number(beforeMatch[1]);
  } else if (afterMatch) {
    result.foodRelation = "after_food";
    if (afterMatch[1]) result.foodOffsetMinutes = Number(afterMatch[1]);
  } else if (withMatch) {
    result.foodRelation = "with_food";
  } else if (anytimeMatch) {
    result.foodRelation = "anytime";
  }

  if (durationMatch) {
    result.days = Number(durationMatch[1]);
  }

  return result;
}

export function MedicineView() {
  const { userRole, medicines, setMedicines } = useAppContext();
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMed, setNewMed] = useState<Partial<Medicine>>({
    name: "",
    dosage: "",
    sessions: ["morning"],
    period: "morning",
    time: "Morning",
    foodRelation: "after_food",
    foodOffsetMinutes: 30,
    days: 30,
    duration: "30 days",
  });

  useEffect(() => {
    async function loadMeds() {
      setIsLoading(true);
      try {
        const data = await fetchApi("/medications", { method: "GET" });
        if (data && Array.isArray(data)) {
          const mapped: Medicine[] = data.map((d: Record<string, unknown>) => {
            const frequency = typeof d.frequency === "string" ? d.frequency : "";
            const instructions = typeof d.instructions === "string" ? d.instructions : "";
            const parsedSessions = frequency
              .split(",")
              .map((session) => session.trim().toLowerCase())
              .filter((session): session is Medicine["period"] =>
                SESSION_OPTIONS.includes(session as Medicine["period"])
              );
            const sessions = parsedSessions.length > 0 ? parsedSessions : ["morning"];
            const parsed = parseFoodAndDaysFromInstructions(instructions);

            return {
              sessions,
              id: d.id as string | number,
              name: String(d.name || ""),
              dosage: String(d.dosage || ""),
              time: frequency || sessions.map((session) => titleCase(session)).join(", "),
              period: "morning",
              duration: instructions || "Ongoing",
              foodRelation: parsed.foodRelation,
              foodOffsetMinutes: parsed.foodOffsetMinutes,
              days: parsed.days,
              taken: false, // local state reset daily
            };
          });
          mapped.forEach((med) => {
            med.period = med.sessions?.[0] || "morning";
          });
          setMedicines(mapped);
        }
      } catch (e) {
        console.error("Failed to load medicines", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadMeds();
  }, [setMedicines]);


  const resetNewMed = () => {
    setNewMed({
      name: "",
      dosage: "",
      sessions: ["morning"],
      period: "morning",
      time: "Morning",
      foodRelation: "after_food",
      foodOffsetMinutes: 30,
      days: 30,
      duration: "30 days",
    });
  };

  const openAddModal = () => {
    setEditingMedId(null);
    resetNewMed();
    setIsAddMode(true);
  };

  const openEditModal = (med: Medicine) => {
    setEditingMedId(med.id);
    setNewMed({
      name: med.name,
      dosage: med.dosage,
      sessions: med.sessions && med.sessions.length ? med.sessions : ["morning"],
      period: (med.sessions?.[0] || med.period || "morning") as Medicine["period"],
      time: med.sessions?.map((s) => titleCase(s)).join(", ") || med.time || "Morning",
      foodRelation: med.foodRelation || "anytime",
      foodOffsetMinutes: med.foodOffsetMinutes ?? 0,
      days: med.days ?? 30,
      duration: med.duration || "30 days",
    });
    setIsAddMode(true);
  };

  const handleSaveMedicine = async () => {
    if (!newMed.name || !newMed.dosage || !newMed.sessions?.length || !newMed.days || newMed.days < 1) return;

    const sessionsLabel = newMed.sessions.map((session) => titleCase(session)).join(", ");
    const foodGuidance = formatFoodGuidance(newMed.foodRelation, newMed.foodOffsetMinutes);
    const durationLabel = `${newMed.days} day${newMed.days === 1 ? "" : "s"}`;
    const instructions = `${foodGuidance} | Duration: ${durationLabel}`;

    try {
      const endpoint = editingMedId ? `/medications/${editingMedId}` : "/medications";
      const method = editingMedId ? "PUT" : "POST";

      const res = await fetchApi(endpoint, {
        method,
        body: JSON.stringify({
          name: newMed.name,
          dosage: newMed.dosage,
          frequency: sessionsLabel,
          instructions,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + (newMed.days || 30) * 86400000).toISOString().split('T')[0],
        })
      });

      const med: Medicine = {
        id: res.id,
        name: res.name!,
        dosage: res.dosage!,
        sessions: newMed.sessions,
        time: res.frequency! || sessionsLabel,
        period: newMed.sessions[0],
        foodRelation: newMed.foodRelation,
        foodOffsetMinutes: newMed.foodOffsetMinutes,
        days: newMed.days,
        duration: res.instructions || instructions,
        taken: false
      };

      if (editingMedId) {
        setMedicines(medicines.map((m) => (m.id === med.id ? { ...m, ...med } : m)));
      } else {
        setMedicines([...medicines, med]);
      }
      setIsAddMode(false);
      setEditingMedId(null);
      resetNewMed();
    } catch (err) {
      console.error("Failed to save medication", err);
    }
  };

  const handleDeleteMedicine = async (med: Medicine) => {
    if (!confirm(`Delete "${med.name}"?`)) return;
    try {
      await fetchApi(`/medications/${med.id}`, { method: "DELETE" });
      setMedicines(medicines.filter((m) => m.id !== med.id));
    } catch (err) {
      console.error("Failed to delete medication", err);
    }
  };

  const toggleTaken = async (med: Medicine) => {
    if (userRole !== "patient") {
      // Caregivers can manage plans, but only patients can log daily completion/progress.
      return;
    }
    // Optimistic UI update
    setMedicines(medicines.map(m => m.id === med.id ? { ...m, taken: !m.taken } : m));
    if (!med.taken) {
      // If marking as taken, log intake
      try {
        await fetchApi(`/medications/${med.id}/log`, { method: "POST" });
      } catch (err) {
        console.error("Failed to log medicine intake", err);
      }
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        completeScan();
      }, 2000);
    }
  };

  const completeScan = () => {
    setIsUploading(false);
    setNewMed({
      name: "Amoxicillin",
      dosage: "500mg",
      sessions: ["afternoon", "night"],
      period: "afternoon",
      time: "Afternoon, Night",
      foodRelation: "after_food",
      foodOffsetMinutes: 30,
      days: 7,
      duration: "7 days",
    });
    setIsAddMode(true);
  };

  const progress = Math.round((medicines.filter(m => m.taken).length / medicines.length) * 100) || 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Medicine Tracker</h1>
          <p className="text-muted">Stay on top of your daily prescriptions.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all glow-primary"
          >
            <PlusCircle className="w-5 h-5" /> Add
          </button>
          <button 
            onClick={handleScanClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all glow-accent disabled:opacity-50"
          >
            <Upload className="w-5 h-5" /> {isUploading ? "Uploading..." : "Choose File"}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg,.webp" 
            onChange={handleFileUpload} 
          />
        </div>
      </header>

      {/* Progress Card */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="stroke-surface fill-none" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="45" 
              className="stroke-primary fill-none transition-all duration-1000 ease-in-out" 
              strokeWidth="8"
              strokeDasharray={`${progress * 2.83} 283`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{progress}%</span>
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-semibold mb-2">Daily Progress</h2>
          <p className="text-muted mb-4 text-base">
            You&apos;ve taken {medicines.filter(m => m.taken).length} out of {medicines.length} medicines today.
            {progress === 100 ? " Great job!" : " Keep it up!"}
          </p>
        </div>
      </div>

      {/* Medicine List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold pl-2">Current Medications</h3>
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : medicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center glass-card">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-muted mb-4">
                <Pill className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Medications Found</h3>
              <p className="text-muted max-w-sm">You haven&apos;t added any medications yet. Click the &quot;Add&quot; button above to get started.</p>
            </div>
          ) : (
            SESSION_OPTIONS.map((session) => {
              const sessionMeds = medicines.filter((m) => {
                const sessions = m.sessions && m.sessions.length ? m.sessions : [m.period];
                return sessions.includes(session);
              });

              return (
                <div key={session} className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-bold text-muted uppercase tracking-wider">
                      {titleCase(session)}
                    </h4>
                    <span className="text-xs font-mono text-muted bg-surface px-2 py-1 rounded-full border border-card-border/50">
                      {sessionMeds.length}
                    </span>
                  </div>

                  {sessionMeds.length > 0 ? (
                    sessionMeds.map((med, index) => (
                      <motion.div
                        key={`${med.id}-${session}`}
                        onClick={userRole === "patient" ? () => toggleTaken(med) : undefined}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        className={`glass-card p-5 flex items-center gap-4 transition-all duration-300 ${
                          med.taken ? "border-primary/30 bg-primary/5" : "hover:border-primary/20"
                        } ${userRole === "patient" ? "cursor-pointer" : "cursor-default opacity-95"}`}
                      >
                        <div
                          className={`p-3 rounded-full shrink-0 transition-colors ${
                            med.taken ? "bg-primary text-white" : "bg-surface text-muted"
                          }`}
                        >
                          <Pill className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-lg font-semibold truncate text-foreground">{med.name}</h5>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted mt-1">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted/50"></span>
                              {med.dosage}
                            </span>
                            <span className="flex items-center gap-1 text-primary">
                              <Clock className="w-3.5 h-3.5" />
                              {med.sessions?.map((s) => titleCase(s)).join(", ") || med.time}
                            </span>
                            <span className="text-xs italic">
                              {formatFoodGuidance(med.foodRelation, med.foodOffsetMinutes)}
                            </span>
                            <span className="text-xs italic">
                              Duration: {med.days ? `${med.days} days` : med.duration}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(med);
                            }}
                            className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-surface transition-colors"
                            aria-label="Edit medication"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-muted" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedicine(med);
                            }}
                            className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-danger/10 hover:border-danger/30 transition-colors"
                            aria-label="Delete medication"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-sm text-muted px-2 py-2">
                      No medications scheduled.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {isAddMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card w-full max-w-md p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Add Medication</h2>
                <button
                  onClick={() => {
                    setIsAddMode(false);
                    setEditingMedId(null);
                    resetNewMed();
                  }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medicine Name</label>
                  <input 
                    type="text" 
                    value={newMed.name}
                    onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                    className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g., Amoxicillin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sessions of the Day</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SESSION_OPTIONS.map((session) => {
                      const active = newMed.sessions?.includes(session);
                      return (
                        <button
                          key={session}
                          type="button"
                          onClick={() =>
                            setNewMed((prev) => {
                              const current = prev.sessions || [];
                              if (current.includes(session)) {
                                const next = current.filter((s) => s !== session);
                                return {
                                  ...prev,
                                  sessions: next.length ? next : current,
                                  period: (next[0] || prev.period || "morning") as Medicine["period"],
                                  time: (next.length ? next : current).map((s) => titleCase(s)).join(", "),
                                };
                              }
                              const next = [...current, session];
                              return {
                                ...prev,
                                sessions: next,
                                period: (next[0] || "morning") as Medicine["period"],
                                time: next.map((s) => titleCase(s)).join(", "),
                              };
                            })
                          }
                          className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                            active
                              ? "bg-primary text-white border-primary"
                              : "bg-surface border-card-border hover:border-primary/40"
                          }`}
                        >
                          {titleCase(session)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Dosage</label>
                    <input 
                      type="text" 
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Food Timing</label>
                    <select 
                      value={newMed.foodRelation}
                      onChange={(e) => setNewMed({...newMed, foodRelation: e.target.value as Medicine["foodRelation"]})}
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    >
                      <option value="before_food">Before food</option>
                      <option value="after_food">After food</option>
                      <option value="with_food">With food</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Minutes Before/After Food</label>
                    <input 
                      type="number"
                      min={0}
                      value={newMed.foodOffsetMinutes ?? 0}
                      onChange={(e) => setNewMed({...newMed, foodOffsetMinutes: Number(e.target.value) || 0})}
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">No. of Days</label>
                    <input 
                      type="number"
                      min={1}
                      value={newMed.days ?? 30}
                      onChange={(e) =>
                        setNewMed({
                          ...newMed,
                          days: Number(e.target.value) || 1,
                          duration: `${Number(e.target.value) || 1} day${Number(e.target.value) === 1 ? "" : "s"}`,
                        })
                      }
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveMedicine}
                className="btn-accessible bg-primary text-white shadow-lg glow-primary"
              >
                {editingMedId ? "Save Changes" : "Add Medication"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="relative w-[300px] h-[300px] border-2 border-white/20 shadow-[0_0_30px_rgba(var(--primary),0.3)] rounded-3xl overflow-hidden flex items-center justify-center">
               <File className="w-24 h-24 text-primary opacity-30" />
               <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
               <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),1)] scan-line"></div>
            </div>
            <p className="mt-8 text-xl font-bold text-white tracking-widest uppercase">
              Uploading Prescription...
            </p>
            <p className="text-white/60 text-lg mt-2 font-medium">Extracting medication details</p>
            <button 
              onClick={() => {
                setIsUploading(false);
              }}
              className="mt-12 px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
