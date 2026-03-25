"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Activity, Plus, X, Camera, Pencil, Trash2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { fetchApi } from "@/lib/api";

type VitalType =
  | "BLOOD_PRESSURE"
  | "BLOOD_SUGAR"
  | "HEART_RATE"
  | "WEIGHT"
  | "OXYGEN_SATURATION"
  | "TEMPERATURE";

type VitalReading = {
  id: string;
  type: VitalType;
  value: number;
  secondaryValue?: number | null;
  unit?: string | null;
  measuredAt?: string | null;
  notes?: string | null;
  criticalFlag?: boolean;
};

export function ProgressView() {
  const { userRole } = useAppContext();
  const canManageVitals = userRole === "patient" || userRole === "caregiver";

  const [isAddMode, setIsAddMode] = useState(false);
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);
  const [isVitalsLoading, setIsVitalsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingVitalId, setDeletingVitalId] = useState<string | null>(null);
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newReading, setNewReading] = useState({
    type: "BLOOD_PRESSURE",
    value: "",
    secondaryValue: "",
    unit: "mmHg",
    notes: ""
  });

  const loadVitals = async () => {
    setIsVitalsLoading(true);
    try {
      const data = await fetchApi("/vitals");
      if (Array.isArray(data)) {
        const mapped: VitalReading[] = (data as Array<Record<string, unknown>>).map((v) => ({
          id: String(v.id),
          type: (typeof v.type === "string" ? (v.type as VitalType) : "BLOOD_PRESSURE"),
          value: typeof v.value === "number" ? v.value : Number(v.value) || 0,
          secondaryValue: v.secondaryValue == null ? null : (typeof v.secondaryValue === "number" ? v.secondaryValue : Number(v.secondaryValue)),
          unit: typeof v.unit === "string" ? v.unit : null,
          measuredAt: typeof v.measuredAt === "string" ? v.measuredAt : null,
          notes: typeof v.notes === "string" ? v.notes : null,
          criticalFlag: Boolean(v.criticalFlag),
        }));
        // Sort chronologically for charts
        setVitals(mapped.sort((a, b) => new Date(a.measuredAt || 0).getTime() - new Date(b.measuredAt || 0).getTime()));
      }
    } catch (err) {
      console.error("Failed to fetch vitals", err);
    } finally {
      setIsVitalsLoading(false);
    }
  };

  useEffect(() => {
    loadVitals();
  }, []);

  const formatType = (type: VitalType) => {
    if (type === "BLOOD_PRESSURE") return "Blood Pressure";
    if (type === "BLOOD_SUGAR") return "Blood Sugar";
    if (type === "HEART_RATE") return "Heart Rate";
    if (type === "WEIGHT") return "Weight";
    if (type === "OXYGEN_SATURATION") return "Oxygen";
    return "Temperature";
  };

  const formatValue = (v: VitalReading) => {
    if (v.type === "BLOOD_PRESSURE") {
      const dia = v.secondaryValue != null ? v.secondaryValue : "--";
      return `${v.value}/${dia}`;
    }
    return `${v.value}`;
  };

  const vitalsDesc = [...vitals].sort(
    (a, b) => new Date(b.measuredAt || 0).getTime() - new Date(a.measuredAt || 0).getTime()
  );

  const handleScanPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("photo", file);

      try {
        const extracted = (await fetchApi("/vitals/extract", {
          method: "POST",
          body: formData
        })) as Record<string, unknown>;
        
        // Auto-fill form
        setNewReading(prev => ({
          ...prev,
          type: (typeof extracted.type === "string" ? extracted.type : prev.type),
          value: extracted.value != null ? String(extracted.value) : "",
          secondaryValue: extracted.secondaryValue != null ? String(extracted.secondaryValue) : "",
          unit: typeof extracted.unit === "string" ? extracted.unit : prev.unit,
        }));
      } catch (err) {
        console.error("OCR vital scan failed", err);
        alert("Failed to read numbers from device photo.");
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleLogReading = async () => {
    if (!newReading.value || isNaN(Number(newReading.value))) return;
    
    setIsSaving(true);
    try {
      const endpoint = editingVitalId ? `/vitals/${editingVitalId}` : "/vitals";
      const method = editingVitalId ? "PUT" : "POST";
      await fetchApi(endpoint, {
        method,
        body: JSON.stringify({
          type: newReading.type,
          value: Number(newReading.value),
          secondaryValue: newReading.secondaryValue ? Number(newReading.secondaryValue) : null,
          unit: newReading.unit,
          notes: newReading.notes
        })
      });
      setIsAddMode(false);
      setEditingVitalId(null);
      setNewReading({ type: "BLOOD_PRESSURE", value: "", secondaryValue: "", unit: "mmHg", notes: "" });
      await loadVitals();
    } catch (err) {
      console.error("Failed to log vital", err);
    } finally {
      setIsSaving(false);
    }
  };

  const openAdd = () => {
    setEditingVitalId(null);
    setNewReading({ type: "BLOOD_PRESSURE", value: "", secondaryValue: "", unit: "mmHg", notes: "" });
    setIsAddMode(true);
  };

  const openEdit = (v: VitalReading) => {
    const type = v.type;
    let unit = v.unit || "mmHg";
    if (type === "BLOOD_SUGAR") unit = unit || "mg/dL";
    if (type === "HEART_RATE") unit = unit || "bpm";
    if (type === "WEIGHT") unit = unit || "kg";
    if (type === "OXYGEN_SATURATION") unit = unit || "%";
    if (type === "TEMPERATURE") unit = unit || "C";

    setEditingVitalId(v.id);
    setNewReading({
      type,
      value: String(v.value ?? ""),
      secondaryValue: v.secondaryValue != null ? String(v.secondaryValue) : "",
      unit,
      notes: v.notes || ""
    });
    setIsAddMode(true);
  };

  const handleDeleteVital = async (id: string) => {
    if (!confirm("Delete this vital reading?")) return;
    try {
      setDeletingVitalId(id);
      await fetchApi(`/vitals/${id}`, { method: "DELETE" });
      await loadVitals();
    } catch (err) {
      console.error("Failed to delete vital", err);
    } finally {
      setDeletingVitalId(null);
    }
  };

  // Convert raw vitals to chart data
  const bpReadings = vitals.filter(v => v.type === "BLOOD_PRESSURE" && v.measuredAt);
  const bpData = bpReadings.map(v => ({
    day: new Date(v.measuredAt as string).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    sys: v.value,
    dia: v.secondaryValue || 80
  }));

  const sugarReadings = vitals.filter(v => v.type === "BLOOD_SUGAR" && v.measuredAt);
  const sugarData = sugarReadings.map(v => ({
    day: new Date(v.measuredAt as string).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    level: v.value
  }));

  const hrReadings = vitals.filter(v => v.type === "HEART_RATE");
  const weightReadings = vitals.filter(v => v.type === "WEIGHT");

  const latestBp = bpReadings.length > 0 ? bpReadings[bpReadings.length - 1] : { value: 0, secondaryValue: 0 };
  const latestSugar = sugarReadings.length > 0 ? sugarReadings[sugarReadings.length - 1] : { value: 0 };
  const latestHr = hrReadings.length > 0 ? hrReadings[hrReadings.length - 1] : { value: 0 };
  const latestWeight = weightReadings.length > 0 ? weightReadings[weightReadings.length - 1] : { value: 0 };

  const summaryStats = [
    { label: "Latest BP", value: latestBp.value ? `${latestBp.value}/${latestBp.secondaryValue}` : "--", unit: "mmHg", color: "primary" },
    { label: "Latest Sugar", value: latestSugar.value || "--", unit: "mg/dL", color: "accent" },
    { label: "Heart Rate", value: latestHr.value || "--", unit: "bpm", color: "danger" },
    { label: "Weight", value: latestWeight.value || "--", unit: "kg", color: "warning" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Health Trends</h1>
          <p className="text-muted mt-2 max-w-xl">
            Track your vitals over time and spot changes early.
          </p>
        </div>
	        {canManageVitals && (
	          <button 
	            onClick={openAdd}
	            className="inline-flex items-center gap-2 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg px-5 py-3 font-bold tracking-tight transition-colors"
	          >
              <Plus className="w-5 h-5" />
              Log Reading
          </button>
        )}
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((stat, idx) => (
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
            {bpData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p>No blood pressure readings to display.</p>
                <p className="text-sm">Log your first reading to see trends!</p>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Blood Sugar Chart */}
        <div className="glass-card p-6 flex flex-col h-[400px]">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Fasting Sugar Levels
          </h2>
          <div className="flex-1 w-full min-h-[250px] relative">
            {sugarData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                <TrendingUp className="w-12 h-12 mb-4 opacity-50 text-accent" />
                <p>No blood sugar readings to display.</p>
                <p className="text-sm">Log your first reading to see trends!</p>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Recent Readings */}
        <div className="space-y-4">
          <div className="flex items-end justify-between px-2">
            <h2 className="text-xl font-semibold">Recent Readings</h2>
            <span className="text-xs text-muted">{vitalsDesc.length} total</span>
          </div>

        {isVitalsLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : vitalsDesc.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Activity className="w-12 h-12 mx-auto text-muted opacity-50 mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-1">No readings yet</h3>
            <p className="text-muted">Log your first vital reading to start tracking trends.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vitalsDesc.map((v) => (
              <div
                key={v.id}
                className={`glass-card p-5 flex items-start gap-4 border transition-colors ${
                  v.criticalFlag ? "border-danger/30 bg-danger/5" : "border-card-border/60 hover:border-primary/20"
                }`}
              >
                <div className={`p-3 rounded-full shrink-0 ${v.criticalFlag ? "bg-danger text-white" : "bg-surface text-muted"}`}>
                  <Activity className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-muted uppercase tracking-wider">{formatType(v.type)}</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {formatValue(v)} <span className="text-sm text-muted font-medium">{v.unit || ""}</span>
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {v.measuredAt ? new Date(v.measuredAt).toLocaleString() : "No timestamp"}
                      </p>
                    </div>
                    {canManageVitals && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-surface transition-colors"
                          title="Edit reading"
                          aria-label="Edit reading"
                        >
                          <Pencil className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVital(v.id)}
                          disabled={deletingVitalId === v.id}
                          className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-danger/10 hover:border-danger/30 transition-colors"
                          title="Delete reading"
                          aria-label="Delete reading"
                        >
                          <Trash2 className={`w-4 h-4 text-danger ${deletingVitalId === v.id ? "opacity-50" : ""}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  {v.notes && (
                    <div className="mt-3 text-sm text-muted bg-surface/60 border border-card-border/50 rounded-xl px-3 py-2">
                      {v.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="glass-card w-full max-w-md p-6 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingVitalId ? "Edit Vital Reading" : "Log Vital Sign"}</h2>
              <button
                onClick={() => {
                  setIsAddMode(false);
                  setEditingVitalId(null);
                  setNewReading({ type: "BLOOD_PRESSURE", value: "", secondaryValue: "", unit: "mmHg", notes: "" });
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between text-primary mb-2">
              <div className="text-sm font-medium">Use AI to scan your device screen</div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleScanPhoto} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isScanning ? <Activity className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isScanning ? "Scanning..." : "Scan"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vital Type</label>
                <select 
                  value={newReading.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    let unit = "mmHg";
                    if (type === "BLOOD_SUGAR") unit = "mg/dL";
                    if (type === "HEART_RATE") unit = "bpm";
                    if (type === "WEIGHT") unit = "kg";
                    if (type === "OXYGEN_SATURATION") unit = "%";
                    if (type === "TEMPERATURE") unit = "C";
                    setNewReading({ ...newReading, type, unit });
                  }}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                  <option value="BLOOD_PRESSURE">Blood Pressure</option>
                  <option value="BLOOD_SUGAR">Blood Sugar</option>
                  <option value="HEART_RATE">Heart Rate</option>
                  <option value="WEIGHT">Weight</option>
                  <option value="OXYGEN_SATURATION">Oxygen Saturation</option>
                  <option value="TEMPERATURE">Temperature</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Value {newReading.type === 'BLOOD_PRESSURE' ? '(Systolic)' : ''}
                  </label>
                  <input 
                    type="number" 
                    value={newReading.value}
                    onChange={(e) => setNewReading({...newReading, value: e.target.value})}
                    className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. 120"
                  />
                </div>
                {newReading.type === "BLOOD_PRESSURE" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Diastolic</label>
                    <input 
                      type="number" 
                      value={newReading.secondaryValue}
                      onChange={(e) => setNewReading({...newReading, secondaryValue: e.target.value})}
                      className="w-full bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 80"
                    />
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleLogReading}
              disabled={isSaving}
              className="btn-accessible bg-primary text-white shadow-lg glow-primary w-full disabled:opacity-50"
            >
              {isSaving ? "Saving..." : (editingVitalId ? "Save Changes" : "Save Reading")}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
