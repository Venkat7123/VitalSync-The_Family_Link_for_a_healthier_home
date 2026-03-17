"use client";

import { motion } from "framer-motion";
import { User, LogOut, Phone, Users, Shield, Save } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function ProfileView() {
  const { userRole, setUserRole } = useAppContext();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    router.push("/login");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-20 fade-in px-4 md:px-0">
      <header className="mb-4">
        <h1 className="text-4xl font-bold mb-2">Settings & Profile</h1>
        <p className="text-muted text-lg">Manage your personal information and connections</p>
      </header>

      {/* Main Profile Info */}
      <section className="bg-card border border-card-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-6 border-b border-card-border pb-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">John Doe</h2>
            <p className="text-primary font-semibold uppercase tracking-wider text-sm mb-2">
              {userRole} Account
            </p>
            <p className="text-muted">john.doe@example.com</p>
          </div>
        </div>

        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
            <input type="text" defaultValue="John Doe" className="w-full bg-surface border border-card-border rounded-lg p-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Date of Birth</label>
            <input type="date" defaultValue="1980-05-15" className="w-full bg-surface border border-card-border rounded-lg p-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-muted mb-1">Medical Conditions (Optional)</label>
            <textarea rows={3} defaultValue="Hypertension, Mild Asthma" className="w-full bg-surface border border-card-border rounded-lg p-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            <Save className="w-4 h-4" /> Save Profile
          </button>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="bg-card border border-card-border p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-danger">
          <Phone className="w-5 h-5" /> Emergency Contacts
        </h3>
        <p className="text-muted text-sm mb-4">These contacts will be notified during SOS emergencies or critical AI alerts.</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-card-border rounded-lg bg-surface">
            <div>
              <p className="font-semibold text-foreground">Jane Doe</p>
              <p className="text-sm text-muted">Spouse (Primary)</p>
            </div>
            <span className="text-foreground font-medium">+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-card-border rounded-lg bg-surface opacity-60">
            <div>
              <p className="font-semibold text-foreground border-b border-dashed border-muted inline-block">Add new contact...</p>
            </div>
            <span className="text-primary font-bold cursor-pointer">+ Add</span>
          </div>
        </div>
      </section>

      {/* Family Pairing */}
      <section className="bg-card border border-card-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" /> Family & Caregiver Pairing
          </h3>
          <span className="bg-success/10 text-success text-xs font-bold px-2 py-1 rounded">Active</span>
        </div>
        <p className="text-muted text-sm mb-4">Pair with family members to share your health insights and live vitals.</p>
        
        <div className="p-4 border border-card-border rounded-lg bg-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-foreground">Dr. Emily Smith</p>
              <p className="text-xs text-muted">View-only access • Paired on Jan 12</p>
            </div>
          </div>
          <button className="text-sm font-semibold text-danger hover:underline">Revoke Access</button>
        </div>

        <div className="mt-4 pt-4 border-t border-card-border">
          <p className="text-sm font-medium mb-2 text-foreground">Your Pairing Code:</p>
          <div className="flex items-center gap-4">
            <code className="px-4 py-2 bg-surface border border-card-border rounded-lg font-mono text-xl tracking-widest text-primary font-bold">
              VS-8492
            </code>
            <button className="text-sm px-4 py-2 bg-secondary text-foreground rounded-lg font-semibold hover:bg-secondary/80">
              Generate New
            </button>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="pt-6 border-t border-card-border/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-danger/30 text-danger font-bold rounded-xl hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out / Switch Role
        </button>
      </div>
    </div>
  );
}

