"use client";

import { motion } from "framer-motion";
import {
  Droplets,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Utensils,
  UploadCloud,
  X,
} from "lucide-react";
import { useAppContext, Report } from "@/context/AppContext";
import { useEffect, useMemo, useRef, useState } from "react";

type DietSession = "morning" | "afternoon" | "evening" | "night";

type DietPlanLogItem = {
  id: number;
  session: DietSession;
  food: string;
  calories: number;
  macros: string;
  notes: string;
  done: boolean;
};

type GeneratedPlanItem = {
  type: string;
  food: string;
  calories: number;
  macros: string;
  alert: string;
};

const SESSION_OPTIONS: DietSession[] = ["morning", "afternoon", "evening", "night"];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sessionFromMealType(type: string): DietSession {
  const t = (type || "").toLowerCase();
  if (t.includes("breakfast") || t.includes("morning")) return "morning";
  if (t.includes("lunch") || t.includes("noon") || t.includes("afternoon")) return "afternoon";
  if (t.includes("dinner") || t.includes("evening")) return "evening";
  if (t.includes("snack") || t.includes("night")) return "night";
  return "morning";
}

function safeParseJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function mapBackendReports(data: unknown[]): Report[] {
  return data.map((d: unknown) => {
    const r = d as Record<string, unknown>;
    return {
      id: Number(r.id),
      date: new Date(String(r.uploadedAt)).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      type: typeof r.fileType === "string" && r.fileType ? r.fileType : "Medical Document",
      status: "Analysis Complete",
      issues: r.criticalFlagged ? 1 : 0,
      importantData:
        (typeof r.extractedMetrics === "string" && r.extractedMetrics) ||
        (typeof r.rawExtractedText === "string" ? r.rawExtractedText.substring(0, 120) : "") ||
        "No metrics extracted",
      fileUrl: typeof r.fileUrl === "string" ? r.fileUrl : undefined,
      extractedMetrics: typeof r.extractedMetrics === "string" ? r.extractedMetrics : undefined,
      rawExtractedText: typeof r.rawExtractedText === "string" ? r.rawExtractedText : undefined,
      insight: {
        type: r.criticalFlagged ? "alert" : "stable",
        message:
          (typeof r.geminiSummary === "string" && r.geminiSummary) ||
          (typeof r.hfAnalysis === "string" && r.hfAnalysis) ||
          "No AI insights generated yet.",
      },
    };
  });
}

export function DietView() {
  const { reports, setReports } = useAppContext();

  const waterTarget = 8;
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPlanItemModal, setShowPlanItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [dietChartDataUrl, setDietChartDataUrl] = useState<string | null>(null);
  const [dietPlanText, setDietPlanText] = useState("");
  const [medicalConditionsInput, setMedicalConditionsInput] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const [dietPlanLogItems, setDietPlanLogItems] = useState<DietPlanLogItem[]>([]);

  const dietChartInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<DietPlanLogItem>({
    id: Date.now(),
    session: "morning",
    food: "",
    calories: 0,
    macros: "P: 0g | C: 0g | F: 0g",
    notes: "",
    done: false,
  });

  const savePlanLogItems = (items: DietPlanLogItem[]) => {
    setDietPlanLogItems(items);
    localStorage.setItem("vs_diet_plan_log_items", JSON.stringify(items));
  };

  const openNewItem = (session: DietSession = "morning") => {
    setEditingItemId(null);
    setDraft({
      id: Date.now(),
      session,
      food: "",
      calories: 0,
      macros: "P: 0g | C: 0g | F: 0g",
      notes: "",
      done: false,
    });
    setShowPlanItemModal(true);
  };

  const openEditItem = (item: DietPlanLogItem) => {
    setEditingItemId(item.id);
    setDraft({ ...item });
    setShowPlanItemModal(true);
  };

  const toggleDone = (id: number) => {
    savePlanLogItems(dietPlanLogItems.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const deleteItem = (id: number) => {
    if (!confirm("Delete this diet plan item?")) return;
    savePlanLogItems(dietPlanLogItems.filter((i) => i.id !== id));
  };

  const handleSaveDraft = () => {
    const food = draft.food.trim();
    if (!food) return;

    const normalized: DietPlanLogItem = {
      ...draft,
      food,
      calories: Number(draft.calories) || 0,
      macros: (draft.macros || "").trim() || "P: 0g | C: 0g | F: 0g",
      notes: (draft.notes || "").trim(),
    };

    if (editingItemId) {
      savePlanLogItems(dietPlanLogItems.map((i) => (i.id === editingItemId ? normalized : i)));
    } else {
      savePlanLogItems([normalized, ...dietPlanLogItems]);
    }

    setShowPlanItemModal(false);
    setEditingItemId(null);
  };

  const handleUploadDietChart = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG/JPG/WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) return;
      setDietChartDataUrl(dataUrl);
      localStorage.setItem("vs_diet_chart_data_url", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const planProgress = useMemo(() => {
    if (dietPlanLogItems.length === 0) return 0;
    return Math.round((dietPlanLogItems.filter((i) => i.done).length / dietPlanLogItems.length) * 100);
  }, [dietPlanLogItems]);

  const grouped = useMemo(() => {
    const map = new Map<DietSession, DietPlanLogItem[]>();
    SESSION_OPTIONS.forEach((s) => map.set(s, []));
    dietPlanLogItems.forEach((i) => map.get(i.session)?.push(i));
    return map;
  }, [dietPlanLogItems]);

  useEffect(() => {
    const savedChart = localStorage.getItem("vs_diet_chart_data_url");
    if (savedChart) setDietChartDataUrl(savedChart);
    const savedText = localStorage.getItem("vs_diet_plan_text");
    if (savedText) setDietPlanText(savedText);
    const savedConditions = localStorage.getItem("vs_diet_medical_conditions");
    if (savedConditions) setMedicalConditionsInput(savedConditions);
    const savedLogItems = localStorage.getItem("vs_diet_plan_log_items");
    if (savedLogItems) {
      try { setDietPlanLogItems(JSON.parse(savedLogItems) as DietPlanLogItem[]); } catch {}
    }
    const todayKey = `vs_water_${new Date().toISOString().slice(0, 10)}`;
    const savedWater = localStorage.getItem(todayKey);
    if (savedWater) setWaterGlasses(Number(savedWater) || 0);
  }, []);

  useEffect(() => {
    const todayKey = `vs_water_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(todayKey, String(waterGlasses));
  }, [waterGlasses]);

  useEffect(() => {
    async function loadReportsIfNeeded() {
      if (reports && reports.length > 0) return;
      try {
        const { fetchApi } = await import("@/lib/api");
        const data = await fetchApi("/reports");
        const list = safeParseJsonArray(data);
        if (list.length > 0) setReports(mapBackendReports(list));
      } catch (err) {
        console.error("Failed to load reports for diet plan", err);
      }
    }
    loadReportsIfNeeded();
  }, [reports, setReports]);

  const generateToLog = async () => {
    setIsGenerating(true);
    try {
      const { fetchApi } = await import("@/lib/api");

      const plan = selectedReportId
        ? await fetchApi("/nutrition/generate-from-report", {
            method: "POST",
            body: JSON.stringify({
              reportId: selectedReportId,
              medicalConditions: medicalConditionsInput,
            }),
          })
        : await fetchApi("/nutrition/generate");

      const list = safeParseJsonArray(plan);
      const generated: GeneratedPlanItem[] = list.map((p: unknown) => {
        const obj = p as Record<string, unknown>;
        return {
          type: typeof obj.type === "string" ? obj.type : "Meal",
          food: typeof obj.food === "string" ? obj.food : "Unknown",
          calories: typeof obj.calories === "number" ? obj.calories : Number(obj.calories) || 0,
          macros: typeof obj.macros === "string" ? obj.macros : "P: 0g | C: 0g | F: 0g",
          alert: typeof obj.alert === "string" ? obj.alert : "",
        };
      });

      const asLog: DietPlanLogItem[] = generated.map((g, idx) => ({
        id: Date.now() + idx,
        session: sessionFromMealType(g.type),
        food: g.food,
        calories: g.calories,
        macros: g.macros,
        notes: g.alert || "",
        done: false,
      }));

      savePlanLogItems(asLog);
      setShowPlanModal(false);
    } catch (err) {
      console.error("Failed to generate diet plan", err);
      alert("Failed to generate diet plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Diet & Nutrition</h1>
          <p className="text-muted">Diet plan logging + hydration tracking.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPlanModal(true)}
            className="p-3 px-5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all glow-primary flex items-center gap-2 shadow-lg"
          >
            <Utensils className="w-5 h-5" />
            Diet Plan
          </button>
          <button
            onClick={() => openNewItem("morning")}
            className="p-3 px-5 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all glow-accent flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Diet Plan Manually
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col justify-center border-t-4 border-t-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Diet Plan Log
            </h2>
            <span className="text-2xl font-bold text-foreground">{planProgress}%</span>
          </div>
          <div className="w-full bg-surface h-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${planProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-sm text-muted mt-3">
            {dietPlanLogItems.filter((i) => i.done).length} of {dietPlanLogItems.length} foods completed today.
          </p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-center border-t-4 border-t-accent">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-accent" />
              Hydration
            </h2>
            <span className="text-2xl font-bold text-foreground">
              {waterGlasses} <span className="text-muted text-base font-normal">/ {waterTarget}</span>
            </span>
          </div>

          <div className="w-full bg-surface h-3 rounded-full overflow-hidden border border-card-border/30 mb-4">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.round((waterGlasses / waterTarget) * 100))}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setWaterGlasses((v) => Math.max(0, v - 1))}
              className="w-12 h-12 rounded-xl bg-surface border border-card-border hover:border-accent/40 transition-colors font-bold text-xl"
              title="Remove 1 glass"
            >
              -
            </button>
            <div className="flex-1 grid grid-cols-4 gap-2">
              {[1, 2, 4, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setWaterGlasses((v) => Math.min(waterTarget, v + n))}
                  className="py-2.5 rounded-xl bg-surface border border-card-border hover:border-accent/40 transition-colors text-sm font-bold"
                  title={`Add ${n}`}
                >
                  +{n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setWaterGlasses((v) => Math.min(waterTarget, v + 1))}
              className="w-12 h-12 rounded-xl bg-accent text-card font-bold text-xl hover:bg-accent/90 transition-colors"
              title="Add 1 glass"
            >
              +
            </button>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm">
            <span className="text-muted font-medium">Glasses of water today</span>
            <button
              onClick={() => setWaterGlasses(0)}
              className="text-muted hover:text-foreground font-semibold"
              title="Reset for today"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between px-2">
          <h3 className="text-xl font-semibold">Diet Plan (By Session)</h3>
          <span className="text-xs text-muted">Tap a card to mark done</span>
        </div>

        <div className="space-y-6">
          {SESSION_OPTIONS.map((session) => {
            const items = grouped.get(session) || [];
            return (
              <div key={session} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-sm font-bold text-muted uppercase tracking-wider">{titleCase(session)}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted bg-surface px-2 py-1 rounded-full border border-card-border/50">
                      {items.length}
                    </span>
                    <button
                      onClick={() => openNewItem(session)}
                      className="text-xs font-bold text-primary hover:underline"
                      title="Add food"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="text-sm text-muted px-2 py-2">No foods added.</div>
                ) : (
                  <div className="grid gap-3">
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleDone(item.id)}
                        className={`glass-card p-5 flex items-start gap-4 transition-all duration-300 cursor-pointer ${
                          item.done ? "border-primary/30 bg-primary/5" : "hover:border-primary/20"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-full shrink-0 transition-colors ${
                            item.done ? "bg-primary text-white" : "bg-surface text-muted"
                          }`}
                        >
                          <Utensils className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-lg font-semibold truncate text-foreground">{item.food}</h5>
                            <span className="text-xs font-mono bg-surface px-2 py-0.5 rounded text-muted border border-card-border/50 shrink-0">
                              {item.calories} kcal
                            </span>
                          </div>
                          <div className="text-sm text-primary font-medium mt-1">{item.macros}</div>
                          {item.notes && <div className="text-sm text-muted mt-1">{item.notes}</div>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditItem(item);
                            }}
                            className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-surface transition-colors"
                            aria-label="Edit diet item"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-muted" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            className="p-2 rounded-lg border border-card-border bg-surface/50 hover:bg-danger/10 hover:border-danger/30 transition-colors"
                            aria-label="Delete diet item"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Diet Plan Modal (Upload + AI + Text) */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="glass-card w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Diet Plan</h2>
              <button onClick={() => setShowPlanModal(false)}>
                <X className="w-6 h-6 text-muted hover:text-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-surface border border-card-border rounded-xl p-4 space-y-3">
                <p className="font-bold text-foreground">Upload Your Diet Chart (Image)</p>
                <p className="text-sm text-muted">Saves to this device.</p>
                <input
                  type="file"
                  ref={dietChartInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleUploadDietChart}
                />
                <button
                  onClick={() => dietChartInputRef.current?.click()}
                  className="w-full bg-primary text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <UploadCloud className="w-5 h-5" /> Upload Diet Chart Image
                </button>
                {dietChartDataUrl && (
                  <div className="rounded-xl overflow-hidden border border-card-border">
                    <img src={dietChartDataUrl} alt="Diet chart preview" className="w-full h-44 object-cover" />
                  </div>
                )}
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold text-accent text-base">Generate Diet Plan With AI</p>
                    <p className="text-muted">Generates log items by session.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold tracking-widest uppercase text-muted">
                    Medical Conditions / Disease
                  </label>
                  <input
                    value={medicalConditionsInput}
                    onChange={(e) => {
                      setMedicalConditionsInput(e.target.value);
                      localStorage.setItem("vs_diet_medical_conditions", e.target.value);
                    }}
                    className="w-full bg-card border border-card-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/40"
                    placeholder="e.g. Diabetes, hypertension, thyroid..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold tracking-widest uppercase text-muted">
                      Select Health Report
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const first = reports && reports.length > 0 ? reports[0] : null;
                        setSelectedReportId(first ? first.id : null);
                      }}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Use Latest
                    </button>
                  </div>

                  {(!reports || reports.length === 0) ? (
                    <p className="text-sm text-muted">No reports found. Upload a report first in Reports tab.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {reports.slice(0, 6).map((r) => {
                        const active = selectedReportId === r.id;
                        const isPdf = (r.type || "").toLowerCase().includes("pdf");
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedReportId(r.id)}
                            className={`w-full text-left rounded-xl border p-3 transition-colors flex items-center gap-3 ${
                              active ? "border-accent/60 bg-accent/10" : "border-card-border bg-surface hover:border-accent/40"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-card-border bg-card flex items-center justify-center shrink-0">
                              {r.fileUrl ? (
                                isPdf ? (
                                  <FileText className="w-6 h-6 text-muted" />
                                ) : (
                                  <img src={r.fileUrl} alt="Report" className="w-full h-full object-cover" />
                                )
                              ) : (
                                <FileText className="w-6 h-6 text-muted" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{r.date}</p>
                              <p className="text-xs text-muted truncate">{r.insight?.message}</p>
                            </div>
                            <div className="ml-auto text-xs font-mono text-muted">{active ? "Selected" : ""}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={generateToLog}
                  disabled={isGenerating}
                  className="w-full bg-accent text-card px-4 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isGenerating ? "Generating..." : selectedReportId ? "Generate From Selected Report" : "Generate Diet Plan"}
                </button>
              </div>

              <div className="bg-surface border border-card-border rounded-xl p-4 space-y-3">
                <p className="font-bold text-foreground">Add Your Own Plan (Text)</p>
                <textarea
                  value={dietPlanText}
                  onChange={(e) => {
                    setDietPlanText(e.target.value);
                    localStorage.setItem("vs_diet_plan_text", e.target.value);
                  }}
                  className="w-full min-h-[120px] bg-card border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={"Example:\nMorning: ...\nAfternoon: ...\nEvening: ...\nNight: ..."}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex-1 py-3 bg-surface border border-card-border hover:border-primary text-foreground font-bold rounded-xl transition-all"
              >
                Done
              </button>
              <button
                onClick={() => {
                  setDietChartDataUrl(null);
                  setDietPlanText("");
                  setSelectedReportId(null);
                  setMedicalConditionsInput("");
                  savePlanLogItems([]);
                  localStorage.removeItem("vs_diet_chart_data_url");
                  localStorage.removeItem("vs_diet_plan_text");
                  localStorage.removeItem("vs_diet_medical_conditions");
                }}
                className="px-4 py-3 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-xl font-bold transition-colors"
                title="Clear saved plan from this device"
              >
                Clear
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Add/Edit Modal */}
      {showPlanItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="glass-card w-full max-w-lg p-6 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{editingItemId ? "Edit Diet Item" : "Add Diet Item"}</h2>
              <button
                onClick={() => {
                  setShowPlanItemModal(false);
                  setEditingItemId(null);
                }}
              >
                <X className="w-6 h-6 text-muted hover:text-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted">Session</label>
                  <select
                    value={draft.session}
                    onChange={(e) => setDraft((d) => ({ ...d, session: e.target.value as DietSession }))}
                    className="w-full bg-surface border border-card-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {SESSION_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {titleCase(s)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-muted">Calories</label>
                  <input
                    type="number"
                    value={draft.calories}
                    onChange={(e) => setDraft((d) => ({ ...d, calories: Number(e.target.value) || 0 }))}
                    className="w-full bg-surface border border-card-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. 350"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Food</label>
                <input
                  type="text"
                  value={draft.food}
                  onChange={(e) => setDraft((d) => ({ ...d, food: e.target.value }))}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Oatmeal with berries"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Macros</label>
                <input
                  type="text"
                  value={draft.macros}
                  onChange={(e) => setDraft((d) => ({ ...d, macros: e.target.value }))}
                  className="w-full bg-surface border border-card-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="P: 10g | C: 60g | F: 5g"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-muted">Notes</label>
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  className="w-full min-h-[90px] bg-surface border border-card-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Optional notes (avoid sugar, low sodium, etc.)"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl transition-all hover:bg-primary/90 glow-primary"
              >
                {editingItemId ? "Save Changes" : "Add Item"}
              </button>
              {editingItemId && (
                <button
                  onClick={() => {
                    if (editingItemId) deleteItem(editingItemId);
                    setShowPlanItemModal(false);
                    setEditingItemId(null);
                  }}
                  className="px-4 py-3 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-xl font-bold transition-colors"
                  title="Delete item"
                >
                  Delete
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
