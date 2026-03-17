"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity, Plus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export function ProgressView() {
  const { userRole } = useAppContext();

  // Mock data for charting
  const bpData = [
    { day: "Mon", sys: 120, dia: 80 },
    { day: "Tue", sys: 122, dia: 82 },
    { day: "Wed", sys: 118, dia: 79 },
    { day: "Thu", sys: 125, dia: 84 },
    { day: "Fri", sys: 121, dia: 81 },
    { day: "Sat", sys: 119, dia: 78 },
    { day: "Sun", sys: 120, dia: 80 },
  ];

  const sugarData = [
    { day: "Mon", level: 95 },
    { day: "Tue", level: 102 },
    { day: "Wed", level: 98 },
    { day: "Thu", level: 110 },
    { day: "Fri", level: 96 },
    { day: "Sat", level: 94 },
    { day: "Sun", level: 92 },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Health Trends</h1>
          <p className="text-muted">Monitor your vital signs and overall progress.</p>
        </div>
        {userRole === "patient" && (
          <button className="flex items-center gap-2 btn-accessible bg-primary text-white hover:bg-primary/90 glow-primary px-6 py-3 rounded-xl w-auto" style={{ minHeight: 'auto' }}>
            <Plus className="w-5 h-5" />
            Log Reading
          </button>
        )}
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg BP", value: "120/80", unit: "mmHg", trend: "stable", color: "primary" },
          { label: "Avg Sugar", value: "98", unit: "mg/dL", trend: "down", color: "accent" },
          { label: "Heart Rate", value: "72", unit: "bpm", trend: "stable", color: "danger" },
          { label: "Weight", value: "75", unit: "kg", trend: "down", color: "warning" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card p-5 border-b-4 border-b-${stat.color}`}
          >
            <p className="text-sm text-muted mb-1 font-medium">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-bold">{stat.value}</span>
              <span className="text-sm text-muted">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blood Pressure Chart */}
        <div className="glass-card p-6 flex flex-col h-[400px]">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Blood Pressure Trends
          </h2>
          <div className="flex-1 w-full min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bpData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c8cff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6c8cff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38d9a9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38d9a9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141b32', border: '1px solid rgba(100,140,255,0.2)', borderRadius: '12px', color: '#f0f4ff' }}
                  itemStyle={{ color: '#f0f4ff' }}
                />
                <Area type="monotone" dataKey="sys" name="Systolic" stroke="#6c8cff" strokeWidth={3} fillOpacity={1} fill="url(#colorSys)" />
                <Area type="monotone" dataKey="dia" name="Diastolic" stroke="#38d9a9" strokeWidth={3} fillOpacity={1} fill="url(#colorDia)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Sugar Chart */}
        <div className="glass-card p-6 flex flex-col h-[400px]">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Fasting Sugar Levels
          </h2>
          <div className="flex-1 w-full min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sugarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38d9a9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38d9a9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8892b0" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141b32', border: '1px solid rgba(56,217,169,0.2)', borderRadius: '12px', color: '#f0f4ff' }}
                />
                <Area type="monotone" dataKey="level" name="Sugar Level" stroke="#38d9a9" strokeWidth={3} fillOpacity={1} fill="url(#colorSugar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
