"use client";

import { motion } from "framer-motion";
import { Users, Activity, Pill, FileText, Link2, RefreshCw } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

type FamilyLink = {
  status?: string;
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
};

type Medication = {
  id: string;
  name?: string;
  dosage?: string;
  instructions?: string;
};

type HealthReport = {
  id: string;
  uploadedAt?: string;
  criticalFlagged?: boolean;
  geminiSummary?: string;
};

export function CaregiverHubView() {
  const { userRole, setCurrentView } = useAppContext();

  const [isLoading, setIsLoading] = useState(true);
  const [activePatient, setActivePatient] = useState<{ id: string; name: string; email: string } | null>(null);
  const [linkCode, setLinkCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);

  const loadLinksAndData = async () => {
    setIsLoading(true);
    try {
      const links = (await fetchApi("/family/members")) as FamilyLink[];
      const active = Array.isArray(links)
        ? links.find((l) => (l.status || "").toUpperCase() === "ACTIVE" && l.patientId)
        : undefined;

      if (!active?.patientId) {
        setActivePatient(null);
        setMedications([]);
        setReports([]);
        return;
      }

      const patient = {
        id: active.patientId,
        name: active.patientName || "Patient",
        email: active.patientEmail || "",
      };
      setActivePatient(patient);

      try {
        localStorage.setItem("vs_active_patient", JSON.stringify({
          patientId: patient.id,
          patientName: patient.name,
          patientEmail: patient.email,
        }));
      } catch {}

      // These endpoints return the linked patient's data automatically (backend resolves caregiver -> patient).
      const meds = (await fetchApi("/medications")) as Medication[];
      const reps = (await fetchApi("/reports")) as HealthReport[];
      setMedications(Array.isArray(meds) ? meds : []);
      setReports(Array.isArray(reps) ? reps : []);
    } catch (err) {
      console.error("Failed to load caregiver context", err);
      setActivePatient(null);
      setMedications([]);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "caregiver") {
      loadLinksAndData();
    }
  }, [userRole]);

  const handleLinkPatient = async () => {
    if (!linkCode.trim()) return;
    setIsLinking(true);
    try {
      await fetchApi(`/family/accept?code=${encodeURIComponent(linkCode.trim())}`, { method: "POST" });
      setLinkCode("");
      await loadLinksAndData();
    } catch (err) {
      console.error("Failed to accept invite code", err);
      alert("Invalid or expired invite code.");
    } finally {
      setIsLinking(false);
    }
  };

  if (userRole !== "caregiver") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Users className="w-16 h-16 text-muted mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
        <p className="text-muted max-w-sm">This area is reserved for caregivers to monitor their linked patients.</p>
      </div>
    );
  }

  const lastReport = reports[0];
  const criticalCount = reports.filter((r) => r.criticalFlagged).length;
  const medsCount = medications.length;

  const statusLabel = !activePatient ? "NOT LINKED" : (criticalCount > 0 ? "ATTENTION" : "STABLE");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Caregiver Hub</h1>
          <p className="text-muted mt-2">
            {activePatient ? `Monitoring ${activePatient.name}` : "Link a patient to start monitoring."}
          </p>
        </div>
        <button
          onClick={loadLinksAndData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-card-border/60 bg-surface/30 hover:bg-surface/60 text-foreground font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {!activePatient && (
        <div className="rounded-3xl border border-card-border/60 bg-surface/20 p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/25 grid place-items-center text-primary shrink-0">
              <Link2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold tracking-tight">Link a Patient</h2>
              <p className="text-sm text-muted mt-1">
                Enter the patient invite code generated in the patient&apos;s Profile.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  placeholder="Invite code (e.g. A1B2C3D4)"
                  className="flex-1 bg-surface/30 border border-card-border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={handleLinkPatient}
                  disabled={isLinking || !linkCode.trim()}
                  className="px-5 py-3 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 disabled:opacity-60"
                >
                  {isLinking ? "Linking..." : "Link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePatient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-3xl border border-card-border/60 bg-surface/20 p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 border border-accent/25 grid place-items-center text-accent shrink-0">
                  <Activity className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">Patient</div>
                  <div className="text-lg font-black tracking-tight truncate">{activePatient.name}</div>
                  {activePatient.email && <div className="text-sm text-muted truncate">{activePatient.email}</div>}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs text-muted uppercase tracking-wider">Status</div>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wider ${
                    statusLabel === "ATTENTION"
                      ? "bg-warning/20 text-warning"
                      : statusLabel === "STABLE"
                      ? "bg-success/20 text-success"
                      : "bg-surface/40 text-muted"
                  }`}
                >
                  {statusLabel}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-card-border/60 bg-surface/20 p-6 space-y-3">
              <div className="text-sm font-bold">Snapshot</div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Medications</span>
                <span className="font-semibold">{medsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Reports</span>
                <span className="font-semibold">{reports.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Critical Reports</span>
                <span className={`font-bold ${criticalCount ? "text-danger" : "text-muted"}`}>{criticalCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Last Report</span>
                <span className="font-semibold text-primary">
                  {lastReport?.uploadedAt ? new Date(lastReport.uploadedAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentView("medicine")}
                className="rounded-3xl border border-card-border/60 bg-surface/20 p-6 hover:bg-surface/35 transition-colors text-left flex items-start gap-4"
              >
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Medicines</h3>
                  <p className="text-sm text-muted">View and manage the patient&apos;s medication plan.</p>
                </div>
              </button>

              <button
                onClick={() => setCurrentView("intelligence")}
                className="rounded-3xl border border-card-border/60 bg-surface/20 p-6 hover:bg-surface/35 transition-colors text-left flex items-start gap-4"
              >
                <div className="p-3 bg-accent/10 rounded-2xl text-accent border border-accent/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">Reports</h3>
                  <p className="text-sm text-muted">Review AI-analyzed health reports.</p>
                </div>
              </button>
            </div>

            <div className="rounded-3xl border border-card-border/60 bg-surface/20 p-6">
              <h3 className="text-lg font-black tracking-tight">Recent Medications</h3>
              <p className="text-sm text-muted mt-1">Pulled from the linked patient account.</p>

              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <div className="text-sm text-muted">Loading...</div>
                ) : medications.length === 0 ? (
                  <div className="text-sm text-muted">No medications found.</div>
                ) : (
                  medications.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-card-border/50 bg-surface/30"
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">{m.name || "Unnamed medicine"}</div>
                        <div className="text-sm text-muted truncate">
                          {m.dosage || ""}{m.instructions ? ` · ${m.instructions}` : ""}
                        </div>
                      </div>
                      <div className="text-xs text-muted shrink-0">{m.id.slice(0, 6).toUpperCase()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
