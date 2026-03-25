"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Phone, Users, Shield, Save } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { fetchApi, apiLogout, getUser } from "@/lib/api";

type ProfileData = {
  fullName?: string;
  dateOfBirth?: string;
  medicalConditions?: string;
  phoneNumber?: string;
  language?: string;
  emergencyContacts?: string[];
  role?: string;
  email?: string;
};

const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

export function ProfileView() {
  const { userRole, setUserRole } = useAppContext();
  const router = useRouter();
  const [, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    medicalConditions: "",
    phoneNumber: "",
    language: "en",
    emergencyContacts: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [linkedMember, setLinkedMember] = useState<{ name: string; email: string; label: string } | null>(null);
  const localUser = getUser();
  // Some pages rely on context role, others on persisted user; unify for gating UI + payloads.
  const effectiveRole =
    ((localUser as { role?: string } | null)?.role || userRole || "").toString().toLowerCase();

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchApi("/profile");
        setProfileData(data);
        if (data) {
          setFormData({
            fullName: data.fullName || "",
            dateOfBirth: data.dateOfBirth || "",
            medicalConditions: data.medicalConditions || "",
            phoneNumber: data.phoneNumber || "",
            language: data.language || "en",
            emergencyContacts: data.emergencyContacts || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch backend profile:", err);
      }
    }
    loadProfile();
  }, [userRole]);

  useEffect(() => {
    async function loadLinked() {
      // Don't block on context role; sometimes it's only available from persisted user.
      if (!effectiveRole) return;
      try {
        const links = (await fetchApi("/family/members")) as Array<Record<string, unknown>>;
        const active = Array.isArray(links)
          ? links.find((l) => String(l.status || "").toUpperCase() === "ACTIVE")
          : undefined;

        if (!active) {
          setLinkedMember(null);
          return;
        }

        if (effectiveRole === "patient") {
          const name = typeof active.caregiverName === "string" ? active.caregiverName : "";
          const email = typeof active.caregiverEmail === "string" ? active.caregiverEmail : "";
          setLinkedMember(name ? { name, email, label: "Caregiver" } : null);
        } else {
          const name = typeof active.patientName === "string" ? active.patientName : "";
          const email = typeof active.patientEmail === "string" ? active.patientEmail : "";
          setLinkedMember(name ? { name, email, label: "Patient" } : null);
        }
      } catch (err) {
        console.error("Failed to load linked member", err);
        setLinkedMember(null);
      }
    }
    loadLinked();
  }, [effectiveRole]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth || null,
        medicalConditions: effectiveRole === "patient" ? formData.medicalConditions : undefined,
        phoneNumber: formData.phoneNumber,
        language: formData.language,
        emergencyContacts: effectiveRole === "patient" ? formData.emergencyContacts : undefined,
      };
      const data = await fetchApi("/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setProfileData(data);
      alert("Profile saved successfully");
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Error saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContact = () => {
    if (newContact.trim() && !formData.emergencyContacts.includes(newContact.trim())) {
      setFormData({
        ...formData,
        emergencyContacts: [...formData.emergencyContacts, newContact.trim()]
      });
      setNewContact("");
    }
  };

  const handleRemoveContact = (idx: number) => {
    setFormData({
      ...formData,
      emergencyContacts: formData.emergencyContacts.filter((_, i) => i !== idx)
    });
  };

  const handleLogout = async () => {
    await apiLogout();
    setUserRole(null);
    router.push("/login");
  };

  const accountRole = (localUser as { role?: string } | null)?.role || userRole || "Member";
  const accountName = (localUser as { fullName?: string } | null)?.fullName || "Unknown User";
  const accountEmail = (localUser as { email?: string } | null)?.email || "No email available";
  const connectionLabel = effectiveRole === "patient" ? "Caregiver" : "Patient";

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    try {
      const data = await fetchApi("/family/invite", { method: "POST" });
      const code = (data && typeof data.inviteCode === "string") ? data.inviteCode : "";
      setInviteCode(code);
      if (code) {
        try {
          navigator.clipboard?.writeText(code);
        } catch {}
      }
    } catch (err) {
      console.error("Failed to generate invite code", err);
      alert("Failed to generate invite code.");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 pb-20 space-y-6">
      <motion.section
        initial={sectionReveal.initial}
        animate={sectionReveal.animate}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-card-border bg-card p-6 md:p-8"
      >
        <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-8 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4 md:gap-5">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <User className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Profile</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">{accountName}</h1>
              <p className="text-sm text-muted">{accountEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-72">
            <div className="rounded-xl border border-card-border bg-surface px-4 py-3">
              <p className="text-xs text-muted uppercase tracking-wider">Role</p>
              <p className="text-sm font-semibold text-foreground">{accountRole}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-surface px-4 py-3">
              <p className="text-xs text-muted uppercase tracking-wider">{connectionLabel}</p>
              <p className="text-sm font-semibold text-foreground">
                {linkedMember?.label === connectionLabel ? linkedMember.name : "Not linked"}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.section
          initial={sectionReveal.initial}
          animate={sectionReveal.animate}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="lg:col-span-2 rounded-3xl border border-card-border bg-card p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </h2>
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Shield className="h-3.5 w-3.5" />
              Secured
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-surface border border-card-border rounded-xl p-3 text-base text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full bg-surface border border-card-border rounded-xl p-3 text-base text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
                <option value="te">Telugu</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-surface border border-card-border rounded-xl p-3 text-base text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. +91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full bg-surface border border-card-border rounded-xl p-3 text-base text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            {effectiveRole === "patient" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted mb-1.5">Medical Conditions</label>
                <textarea
                  rows={4}
                  value={formData.medicalConditions}
                  onChange={e => setFormData({ ...formData, medicalConditions: e.target.value })}
                  className="w-full bg-surface border border-card-border rounded-xl p-3 text-base text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  placeholder="Add allergies, chronic conditions, or important notes..."
                />
              </div>
            )}

            {effectiveRole === "patient" && (
              <div className="md:col-span-2 rounded-2xl border border-card-border bg-surface/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-danger" />
                  <div className="text-sm font-bold">Emergency Contacts</div>
                </div>
                <p className="text-xs text-muted mb-3">
                  These contacts are notified during SOS triggers and severe health alerts.
                </p>

                <div className="space-y-3">
                  {formData.emergencyContacts.length === 0 && (
                    <div className="rounded-xl border border-dashed border-card-border bg-surface p-4 text-sm text-muted">
                      No emergency contacts added yet.
                    </div>
                  )}
                  {formData.emergencyContacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 border border-card-border rounded-xl bg-surface">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <p className="font-medium text-foreground truncate">{contact}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveContact(idx)}
                        className="text-danger text-sm font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Add Contact</label>
                    <div className="flex items-center gap-2 p-2 border border-card-border rounded-xl bg-surface">
                      <input
                        type="text"
                        placeholder="Phone number"
                        value={newContact}
                        onChange={e => setNewContact(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm md:text-base font-medium text-foreground flex-1 px-2"
                      />
                      <button
                        onClick={handleAddContact}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        disabled={!newContact.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={sectionReveal.initial}
          animate={sectionReveal.animate}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-3xl border border-card-border bg-card p-6 h-fit"
        >
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent" />
            {connectionLabel}
          </h2>
          {effectiveRole === "patient" ? (
            <>
              <div className="rounded-xl border border-card-border bg-surface/30 px-4 py-3 mb-4">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Linked Caregiver</p>
                <p className="text-sm font-semibold text-foreground">
                  {linkedMember?.label === "Caregiver" ? linkedMember.name : "Not linked yet"}
                </p>
                {linkedMember?.label === "Caregiver" && linkedMember.email && (
                  <p className="text-xs text-muted mt-1">{linkedMember.email}</p>
                )}
              </div>
              <p className="text-sm text-muted mb-4">
                Generate an invite code and share it with a caregiver so they can monitor you.
              </p>
              <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 mb-4">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Invite Code</p>
                <code className="font-mono text-lg font-semibold tracking-wider text-accent">
                  {inviteCode || "Not generated yet"}
                </code>
              </div>
              <button
                onClick={handleGenerateInvite}
                disabled={isGeneratingInvite}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-background font-bold hover:bg-accent/90 disabled:opacity-60 transition-colors"
              >
                {isGeneratingInvite ? "Generating..." : (inviteCode ? "Generate New Code" : "Generate Invite Code")}
              </button>
              <p className="text-xs text-muted mt-3">
                Tip: the code is auto-copied to clipboard when generated.
              </p>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-card-border bg-surface/30 px-4 py-3 mb-4">
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Linked Patient</p>
                <p className="text-sm font-semibold text-foreground">
                  {linkedMember?.label === "Patient" ? linkedMember.name : "Not linked yet"}
                </p>
                {linkedMember?.label === "Patient" && linkedMember.email && (
                  <p className="text-xs text-muted mt-1">{linkedMember.email}</p>
                )}
              </div>
              <p className="text-sm text-muted">
                Pairing happens during caregiver sign up using the patient invite code.
              </p>
            </>
          )}
        </motion.section>
      </div>

      {/* Emergency contacts are managed within Patient Details above. */}

      <motion.div
        initial={sectionReveal.initial}
        animate={sectionReveal.animate}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="pt-2"
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-danger/30 text-danger font-semibold rounded-xl hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </motion.div>
    </div>
  );
}
