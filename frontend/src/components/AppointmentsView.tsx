"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Plus, BellRing, PhoneCall, Stethoscope, CheckCircle2, User, ChevronRight, X, Sparkles, Pencil, Trash2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

type AppointmentCard = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  isNext: boolean;
  notes?: string;
  dateValue: string;
  timeValue: string;
  rawTitle: string;
  rawDoctorName: string;
};

type Habit = {
  id: string;
  title: string;
  timeOfDay: string;
  completed: boolean;
  aiGenerated?: boolean;
};

export function AppointmentsView() {
  const { userRole } = useAppContext();
  const [appointments, setAppointments] = useState<AppointmentCard[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHabitLoading, setIsHabitLoading] = useState(true);
  
  const [modalType, setModalType] = useState<'appointment' | 'habit' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({ title: "", timeOfDay: "" });
  const [newAppointment, setNewAppointment] = useState({ title: "", doctorName: "", date: "", time: "", location: "", notes: "" });

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi("/appointments");
      if (data && Array.isArray(data)) {
        // Sort by date ascending
        const sorted = (data as Array<Record<string, unknown>>).sort(
          (a, b) =>
            new Date(String(a.appointmentDateTime)).getTime() - new Date(String(b.appointmentDateTime)).getTime()
        );
        
        const mapped: AppointmentCard[] = sorted.map((apt, idx: number) => {
          const dt = new Date(String(apt.appointmentDateTime));
          const dateValue = dt.toLocaleDateString("en-CA"); // YYYY-MM-DD
          const timeValue = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }); // HH:mm
          return {
            id: String(apt.id),
            doctor: (typeof apt.doctorName === "string" && apt.doctorName) ? apt.doctorName : "Unknown Doctor",
            specialty: (typeof apt.title === "string" && apt.title) ? apt.title : "General Visit",
            date: dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            location: (typeof apt.location === "string" && apt.location) ? apt.location : "Clinic Location",
            isNext: idx === 0 && dt.getTime() > Date.now(),
            notes: typeof apt.notes === "string" ? apt.notes : undefined,
            dateValue,
            timeValue,
            rawTitle: typeof apt.title === "string" ? apt.title : "",
            rawDoctorName: typeof apt.doctorName === "string" ? apt.doctorName : "",
          };
        });
        setAppointments(mapped);
      }
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHabits = async () => {
    setIsHabitLoading(true);
    try {
      const data = await fetchApi("/habits");
      setHabits(Array.isArray(data) ? (data as Habit[]) : []);
    } catch (err) {
      console.error("Failed to load habits:", err);
    } finally {
      setIsHabitLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadHabits();
  }, []);

  const handleToggleHabit = async (id: string, currentCompleted: boolean) => {
    if (userRole !== "patient") return; // caregivers can manage habits, but only patients log completion
    try {
      // optimistic
      setHabits(habits.map(h => h.id === id ? { ...h, completed: !currentCompleted } : h));
      await fetchApi(`/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !currentCompleted })
      });
    } catch (err) {
      console.error("Failed to toggle habit", err);
      // revert
      setHabits(habits.map(h => h.id === id ? { ...h, completed: currentCompleted } : h));
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabit.title || !newHabit.timeOfDay) return;
    try {
      const endpoint = editingHabitId ? `/habits/${editingHabitId}` : "/habits";
      const method = editingHabitId ? "PUT" : "POST";
      const created = await fetchApi(endpoint, {
        method,
        body: JSON.stringify({
          title: newHabit.title,
          timeOfDay: newHabit.timeOfDay,
          aiGenerated: false
        })
      });
      if (editingHabitId) {
        setHabits(habits.map((h) => (h.id === created.id ? created : h)));
      } else {
        setHabits([...habits, created]);
      }
      setModalType(null);
      setNewHabit({ title: "", timeOfDay: "" });
      setEditingHabitId(null);
    } catch (err) {
      console.error("Failed to create habit", err);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      await fetchApi(`/habits/${id}`, { method: "DELETE" });
      setHabits(habits.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Failed to delete habit", err);
    }
  };

  const openEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setNewHabit({ title: habit.title || "", timeOfDay: habit.timeOfDay || "" });
    setModalType("habit");
  };

  const handleCreateAppointment = async () => {
    if (!newAppointment.title || !newAppointment.date || !newAppointment.time) return;
    
    // Construct local ISO string: yyyy-MM-ddTHH:mm:00
    const localDateTimeStr = `${newAppointment.date}T${newAppointment.time}:00`;
    
    try {
      const endpoint = editingAppointmentId ? `/appointments/${editingAppointmentId}` : "/appointments";
      const method = editingAppointmentId ? "PUT" : "POST";
      await fetchApi(endpoint, {
        method,
        body: JSON.stringify({
          title: newAppointment.title,
          doctorName: newAppointment.doctorName,
          appointmentDateTime: localDateTimeStr,
          location: newAppointment.location,
          notes: newAppointment.notes
        })
      });
      
      setModalType(null);
      setNewAppointment({ title: "", doctorName: "", date: "", time: "", location: "", notes: "" });
      setEditingAppointmentId(null);
      await loadAppointments();
    } catch (err) {
      console.error("Failed to create appointment", err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Delete this reminder/visit?")) return;
    try {
      await fetchApi(`/appointments/${id}`, { method: "DELETE" });
      await loadAppointments();
    } catch (err) {
      console.error("Failed to delete appointment", err);
    }
  };

  const openEditAppointment = (apt: AppointmentCard) => {
    setEditingAppointmentId(apt.id);
    setNewAppointment({
      title: apt.rawTitle || apt.specialty || "",
      doctorName: apt.rawDoctorName || apt.doctor || "",
      date: apt.dateValue || "",
      time: apt.timeValue || "",
      location: apt.location || "",
      notes: apt.notes || "",
    });
    setModalType("appointment");
  };

  const handleGenerateAIHabits = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchApi("/habits/generate", { method: "POST" });
      setHabits(Array.isArray(data) ? (data as Habit[]) : []);
      setModalType(null);
    } catch (err) {
      console.error("Failed to generate AI habits", err);
      alert("AI Generation failed. Make sure you have a Profile created.");
    } finally {
      setIsGenerating(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-20">
      
      {/* Header remains unchanged as requested */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-card border border-card-border p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
            <Calendar className="w-3.5 h-3.5" /> Appointments
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Visits & Reminders</h1>
          <p className="text-muted text-lg max-w-lg">
            Stay on top of your medical consultations and daily health habits.
          </p>
        </div>

	        <button 
	          onClick={() => {
	            setEditingAppointmentId(null);
	            setNewAppointment({ title: "", doctorName: "", date: "", time: "", location: "", notes: "" });
	            setModalType('appointment');
	          }}
	          className="relative z-10 group flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(108,140,255,0.3)] hover:shadow-[0_0_30px_rgba(108,140,255,0.5)] hover:-translate-y-0.5 w-full md:w-auto overflow-hidden"
	        >
           <div className="absolute inset-0 bg-white/20 w-full transform -translate-x-full group-hover:animate-pulse" />
           <Plus className="w-5 h-5" />
           {userRole === "caregiver" ? "Schedule Visit" : "Add Visit / Reminder"}
        </button>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* NEW UI: Upcoming Visits */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Upcoming Visits
            </h2>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-card border border-dashed border-card-border rounded-xl p-12 text-center shadow-sm">
                <Calendar className="w-16 h-16 text-muted opacity-20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No Upcoming Visits</h3>
                <p className="text-muted">You have no scheduled appointments at this time.</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <motion.div
                  key={apt.id}
                  variants={itemVariants}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 group flex flex-col gap-4 ${
                    apt.isNext 
                      ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/30 shadow-lg shadow-primary/5" 
                      : "bg-surface/50 border-card-border/60 hover:border-card-border"
                  }`}
                >
                  {apt.isNext && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl z-10">
                      Next Appointment
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                      apt.isNext ? "bg-primary text-white" : "bg-card border border-card-border text-foreground"
                    }`}>
                      <User className="w-6 h-6" />
                    </div>
                    
	                    <div className="flex-1 min-w-0">
	                      <div className="flex items-start justify-between gap-3">
	                        <div className="min-w-0">
	                          <h3 className="text-lg font-bold text-foreground truncate">{apt.doctor}</h3>
	                          <p className="text-sm text-primary font-medium flex items-center gap-1.5 mb-2">
	                            <Stethoscope className="w-4 h-4" /> {apt.specialty}
	                          </p>
	                        </div>
	                        <div className="flex items-center gap-2 shrink-0">
	                          <button
	                            type="button"
	                            onClick={() => openEditAppointment(apt)}
	                            className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-surface transition-colors"
	                            title="Edit reminder"
	                            aria-label="Edit reminder"
	                          >
	                            <Pencil className="w-4 h-4 text-muted" />
	                          </button>
	                          <button
	                            type="button"
	                            onClick={() => handleDeleteAppointment(apt.id)}
	                            className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-danger/10 hover:border-danger/30 transition-colors"
	                            title="Delete reminder"
	                            aria-label="Delete reminder"
	                          >
	                            <Trash2 className="w-4 h-4 text-danger" />
	                          </button>
	                        </div>
	                      </div>
	                      
	                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-foreground/50" />
                          {apt.date}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                          <Clock className="w-4 h-4 text-foreground/50" />
                          {apt.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-4 border-t flex items-center justify-between ${
                    apt.isNext ? "border-primary/10" : "border-card-border/50"
                  }`}>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{apt.location}</span>
                    </div>
                    
                    {userRole === "caregiver" ? (
                      <button className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                        <PhoneCall className="w-4 h-4" /> Call Clinic
                      </button>
                    ) : (
                      <button className="w-8 h-8 rounded-full bg-surface border border-card-border flex items-center justify-center hover:bg-card hover:text-primary transition-colors group-hover:border-primary/30 text-muted">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* NEW UI: Daily Habits */}
        <div className="space-y-6">
	          <div className="flex items-center justify-between">
	            <h2 className="text-xl font-bold text-foreground">
	              Daily Habits
	            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingHabitId(null);
                  setNewHabit({ title: "", timeOfDay: "" });
                  setModalType('habit');
                }}
                className="text-sm bg-accent text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-accent/90 shadow-sm transition-all hover:shadow-[0_0_15px_rgba(56,217,169,0.4)]"
              >
                <Plus className="w-4 h-4" /> Add Habit
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-card-border/50 text-xs font-semibold">
                 <span className="text-accent">{habits.filter(r => r.completed).length}</span>
                 <span className="text-muted">/ {habits.length} Completed</span>
              </div>
	            </div>
	          </div>

	          <div className="w-full bg-surface h-3 rounded-full overflow-hidden border border-card-border/30">
	            <motion.div
	              className="h-full bg-accent"
	              initial={{ width: 0 }}
	              animate={{ width: `${habits.length ? Math.round((habits.filter((h) => h.completed).length / habits.length) * 100) : 0}%` }}
	              transition={{ duration: 0.6, ease: "easeOut" }}
	            />
	          </div>
	          
	          <motion.div 
	             variants={containerVariants}
	             initial="hidden"
             animate="show"
             className="grid gap-3"
          >
            {isHabitLoading ? (
              <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : habits.length === 0 ? (
              <div className="text-center p-6 bg-surface/50 border border-card-border border-dashed rounded-xl">
                 <p className="text-muted text-sm">No daily habits yet.</p>
	                 <button
	                   onClick={() => {
	                     setEditingHabitId(null);
	                     setNewHabit({ title: "", timeOfDay: "" });
	                     setModalType('habit');
	                   }}
	                   className="text-primary font-bold text-sm mt-2 hover:underline"
	                 >
	                   Add one now
	                 </button>
	              </div>
	            ) : habits.map((reminder) => (
	              <motion.div 
	                key={reminder.id}
	                variants={itemVariants}
	                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
	                  reminder.completed 
	                    ? "bg-accent/5 border-accent/30" 
	                    : "bg-surface border-card-border hover:border-accent/40"
	                }`}
	              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    reminder.completed ? "bg-accent/10 text-accent" : "bg-card text-muted border border-card-border"
                  }`}>
                    {reminder.completed ? <CheckCircle2 className="w-5 h-5" /> : <BellRing className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm transition-colors flex items-center gap-1.5 ${reminder.completed ? "text-foreground" : "text-muted"}`}>
                      {reminder.title}
                      {reminder.aiGenerated && <Sparkles className="w-3 h-3 text-accent" />}
                    </h4>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {reminder.timeOfDay}
                    </p>
                  </div>
                </div>
                
	                <div className="flex items-center gap-2">
	                  {/* Toggle Switch */}
	                  <button 
	                    onClick={userRole === "patient" ? () => handleToggleHabit(reminder.id, reminder.completed) : undefined}
                      disabled={userRole !== "patient"}
	                    className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${
	                      reminder.completed ? "bg-accent" : "bg-card-border/50"
	                    } ${userRole !== "patient" ? "opacity-50 cursor-not-allowed" : ""}`}
	                  >
	                    <motion.div 
	                      layout
	                      className="w-4 h-4 rounded-full bg-white shadow-sm"
	                      animate={{ x: reminder.completed ? 20 : 0 }}
	                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
	                    />
	                  </button>
	                  <button
	                    type="button"
	                    onClick={() => openEditHabit(reminder)}
	                    className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-surface transition-colors"
	                    title="Edit habit"
	                    aria-label="Edit habit"
	                  >
	                    <Pencil className="w-4 h-4 text-muted" />
	                  </button>
	                  <button
	                    type="button"
	                    onClick={() => handleDeleteHabit(reminder.id)}
	                    className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-danger/10 hover:border-danger/30 transition-colors"
	                    title="Delete habit"
	                    aria-label="Delete habit"
	                  >
	                    <Trash2 className="w-4 h-4 text-danger" />
	                  </button>
	                </div>
	              </motion.div>
	            ))}
          </motion.div>

        </div>

      </div>

      {modalType === 'habit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="glass-card w-full max-w-md p-6 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingHabitId ? "Edit Daily Habit" : "Add Daily Habit"}</h2>
              <button
                onClick={() => {
                  setModalType(null);
                  setEditingHabitId(null);
                  setNewHabit({ title: "", timeOfDay: "" });
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-accent">AI Auto-Generate</p>
                  <p className="text-muted">VitalSync can analyze your Medical Profile and generate 3 custom daily habits for you.</p>
                </div>
              </div>
              <button 
                onClick={handleGenerateAIHabits}
                disabled={isGenerating}
                className="w-full bg-accent text-card px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-accent/90 disabled:opacity-50"
              >
                {isGenerating ? "Analyzing Profile..." : "Generate with AI"}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px bg-card-border flex-1"></div>
              <span className="text-xs text-muted font-bold tracking-widest uppercase">OR MANUALLY</span>
              <div className="h-px bg-card-border flex-1"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Habit Title</label>
                <input 
                  type="text" 
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Drink 2 Glasses of Water"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time of Day</label>
                <input 
                  type="time" 
                  value={newHabit.timeOfDay}
                  onChange={(e) => setNewHabit({...newHabit, timeOfDay: e.target.value})}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-foreground custom-time-input"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateHabit}
              className="btn-accessible bg-primary text-white shadow-lg glow-primary w-full"
            >
              {editingHabitId ? "Save Changes" : "Save Habit"}
            </button>
          </motion.div>
        </div>
      )}

      {modalType === 'appointment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="glass-card w-full max-w-md p-6 space-y-5"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold">{editingAppointmentId ? "Edit Visit" : "Schedule Visit"}</h2>
              <button
                onClick={() => {
                  setModalType(null);
                  setEditingAppointmentId(null);
                  setNewAppointment({ title: "", doctorName: "", date: "", time: "", location: "", notes: "" });
                }}
              >
                <X className="w-6 h-6 outline-none hover:text-primary transition-colors" />
              </button>
            </div>

            <div className="space-y-4 relative w-full h-full">
              <div>
                <label className="block text-sm font-medium mb-1">Reason / Specialty <span className="text-primary">*</span></label>
                <input 
                  type="text" 
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Cardiology Checkup"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Doctor Name</label>
                <input 
                  type="text" 
                  value={newAppointment.doctorName}
                  onChange={(e) => setNewAppointment({...newAppointment, doctorName: e.target.value})}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Dr. Sarah Jenkins"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date <span className="text-primary">*</span></label>
                  <input 
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    className="w-full bg-surface border border-card-border rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time <span className="text-primary">*</span></label>
                  <input 
                    type="time" 
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    className="w-full bg-surface border border-card-border rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-foreground custom-time-input min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  type="text" 
                  value={newAppointment.location}
                  onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. City General Hospital"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateAppointment}
              className="btn-accessible bg-primary text-white shadow-lg glow-primary w-full mt-4"
            >
              {editingAppointmentId ? "Save Changes" : "Confirm Appointment"}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
