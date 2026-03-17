"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Pill, CheckCircle2, Clock, Upload, Search, PlusCircle, X, Camera } from "lucide-react";
import { useAppContext, Medicine } from "@/context/AppContext";
import { useState } from "react";

export function MedicineView() {
  const { userRole, medicines, setMedicines } = useAppContext();
  const [isAddMode, setIsAddMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [newMed, setNewMed] = useState<Partial<Medicine>>({
    name: "",
    dosage: "",
    time: "08:00 AM",
    period: "morning",
    duration: "30 days"
  });


  const handleAddMedicine = () => {
    if (!newMed.name || !newMed.dosage) return;
    
    const med: Medicine = {
      id: Date.now(),
      name: newMed.name!,
      dosage: newMed.dosage!,
      time: newMed.time!,
      period: newMed.period as any,
      duration: newMed.duration!,
      taken: false
    };

    setMedicines([...medicines, med]);
    setIsAddMode(false);
    setNewMed({
      name: "",
      dosage: "",
      time: "08:00 AM",
      period: "morning",
      duration: "30 days"
    });
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setNewMed({
        name: "Amoxicillin",
        dosage: "500mg",
        time: "02:00 PM",
        period: "afternoon",
        duration: "7 days"
      });
      setIsAddMode(true);
    }, 2000);
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
            onClick={() => setIsAddMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all glow-primary"
          >
            <PlusCircle className="w-5 h-5" /> Add
          </button>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all glow-accent disabled:opacity-50"
          >
            <Camera className="w-5 h-5" /> {isScanning ? "Scanning..." : "Scan"}
          </button>
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
            You've taken {medicines.filter(m => m.taken).length} out of {medicines.length} medicines today.
            {progress === 100 ? " Great job!" : " Keep it up!"}
          </p>
        </div>
      </div>

      {/* Medicine List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold pl-2">Current Medications</h3>
        <div className="space-y-3">
          {medicines.map((med, index) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-5 flex items-center gap-4 transition-all duration-300 ${
                med.taken ? "border-primary/30 bg-primary/5" : "hover:border-primary/20"
              }`}
            >
              <div className={`p-3 rounded-full shrink-0 transition-colors ${
                med.taken ? "bg-primary text-white" : "bg-surface text-muted"
              }`}>
                <Pill className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold truncate text-foreground">{med.name}</h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted mt-1">
                  <span className="flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-muted/50"></span>
                     {med.dosage}
                  </span>
                  <span className="flex items-center gap-1 text-primary">
                    <Clock className="w-3.5 h-3.5" />
                    {med.time} ({med.period})
                  </span>
                  <span className="text-xs italic">Duration: {med.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
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
                <button onClick={() => setIsAddMode(false)}><X className="w-6 h-6" /></button>
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
                    <label className="block text-sm font-medium mb-1">Period</label>
                    <select 
                      value={newMed.period}
                      onChange={(e) => setNewMed({...newMed, period: e.target.value as any})}
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input 
                      type="text" 
                      value={newMed.time}
                      onChange={(e) => setNewMed({...newMed, time: e.target.value})}
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="08:00 AM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <input 
                      type="text" 
                      value={newMed.duration}
                      onChange={(e) => setNewMed({...newMed, duration: e.target.value})}
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="30 days"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAddMedicine}
                className="btn-accessible bg-primary text-white shadow-lg glow-primary"
              >
                Add Medication
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
          >
            <div className="relative w-[300px] h-[300px] border-2 border-white/20 rounded-3xl overflow-hidden">
               <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
               <div className="absolute top-0 left-0 w-full h-1 bg-primary glow-primary scan-line"></div>
            </div>
            <p className="mt-8 text-xl font-bold text-white tracking-widest uppercase">Scanning Prescription...</p>
            <button 
              onClick={() => setIsScanning(false)}
              className="mt-12 text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
