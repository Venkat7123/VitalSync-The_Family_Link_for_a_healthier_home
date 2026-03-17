"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Plus, BellRing, PhoneCall, Stethoscope, CheckCircle2, User, ChevronRight } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export function AppointmentsView() {
  const { userRole } = useAppContext();

  const appointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Jenkins",
      specialty: "Cardiologist",
      date: "Tomorrow, Oct 24",
      time: "10:30 AM",
      location: "Heart Center, Room 204",
      isNext: true,
      notes: "Follow-up on recent ECG results."
    },
    {
      id: 2,
      doctor: "Dr. Robert Chen",
      specialty: "General Physician",
      date: "Nov 12, 2026",
      time: "02:15 PM",
      location: "City Medical, Floor 3",
      isNext: false,
    }
  ];

  const reminders = [
    { id: 1, title: "Morning Vitals Check", time: "08:00 AM", active: true },
    { id: 2, title: "Afternoon Stretch", time: "03:00 PM", active: true },
    { id: 3, title: "Check Blood Pressure", time: "06:00 PM", active: true },
    { id: 4, title: "Evening Walk", time: "07:30 PM", active: false },
  ];

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

        <button className="relative z-10 group flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(108,140,255,0.3)] hover:shadow-[0_0_30px_rgba(108,140,255,0.5)] hover:-translate-y-0.5 w-full md:w-auto overflow-hidden">
           <div className="absolute inset-0 bg-white/20 w-full transform -translate-x-full group-hover:animate-pulse" />
           <Plus className="w-5 h-5" />
           {userRole === "caregiver" ? "Schedule Visit" : "Add Reminder"}
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
            {appointments.map((apt) => (
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
                    <h3 className="text-lg font-bold text-foreground truncate">{apt.doctor}</h3>
                    <p className="text-sm text-primary font-medium flex items-center gap-1.5 mb-2">
                      <Stethoscope className="w-4 h-4" /> {apt.specialty}
                    </p>
                    
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
            ))}
          </motion.div>
        </div>

        {/* NEW UI: Daily Habits */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Daily Habits
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-card-border/50 text-xs font-semibold">
               <span className="text-accent">{reminders.filter(r => r.active).length}</span>
               <span className="text-muted">/ {reminders.length} Completed</span>
            </div>
          </div>
          
          <motion.div 
             variants={containerVariants}
             initial="hidden"
             animate="show"
             className="grid gap-3"
          >
            {reminders.map((reminder) => (
              <motion.div 
                key={reminder.id}
                variants={itemVariants}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                  reminder.active 
                    ? "bg-surface border-card-border shadow-sm hover:border-accent/40" 
                    : "bg-background border-transparent opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    reminder.active ? "bg-accent/10 text-accent" : "bg-card text-muted border border-card-border"
                  }`}>
                    {reminder.active ? <CheckCircle2 className="w-5 h-5" /> : <BellRing className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm transition-colors ${reminder.active ? "text-foreground" : "text-muted"}`}>
                      {reminder.title}
                    </h4>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {reminder.time}
                    </p>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <button 
                  disabled={userRole !== 'patient'}
                  className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${
                    reminder.active ? "bg-accent" : "bg-card-border/50"
                  } ${userRole !== 'patient' ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: reminder.active ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-6 p-5 rounded-2xl bg-surface/30 border border-card-border border-dashed text-center">
             <p className="text-sm font-medium text-muted">Building a 14-day streak! Keep up the good work.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
