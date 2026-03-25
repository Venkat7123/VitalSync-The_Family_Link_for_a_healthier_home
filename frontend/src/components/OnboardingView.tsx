"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, HeartHandshake, ArrowLeft, Shield, Activity, Sparkles,
  Loader2, AlertCircle, Quote, Eye, EyeOff,
} from "lucide-react";
import { useAppContext, UserRole } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { apiLogin, apiRegister } from "@/lib/api";

type OnboardingStep = "role" | "auth";
type AuthMode = "sign_in" | "sign_up";

export function OnboardingView() {
  const { setUserRole } = useAppContext();
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<OnboardingStep>("role");
  const [authMode, setAuthMode] = useState<AuthMode>("sign_in");

  // Auth form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setUserRole(role);
    setAuthMode("sign_in");
    setStep("auth");
    setAuthError("");
  };

  const handleBack = () => {
    setSelectedRole(null);
    setStep("role");
    setAuthError("");
  };

  const handleAuthSubmit = async () => {
    if (authMode === "sign_up" && !fullName.trim()) {
      setAuthError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setAuthError("Please enter your email and password.");
      return;
    }
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (authMode === "sign_up" && password.length < 8) {
      setAuthError("Password must be at least 8 characters long.");
      return;
    }

    if (authMode === "sign_up" && selectedRole === "caregiver" && !pairCode.trim()) {
      setAuthError("Pair code is required for caregiver sign up.");
      return;
    }

    setIsAuthLoading(true);
    setAuthError("");

    try {
      if (authMode === "sign_in") {
        const data = await apiLogin(email.trim(), password);
        setUserRole((data.role?.toLowerCase() as UserRole) || selectedRole);
        const next = (data.role?.toLowerCase() as UserRole) === "caregiver" ? "/dashboard/caregiver" : "/dashboard/home";
        router.push(next);
      } else {
        // Sign up with basic details only
        const data = await apiRegister({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          role: (selectedRole || "patient").toUpperCase(),
          pairCode: selectedRole === "caregiver" ? pairCode.trim() : undefined,
        });
        setUserRole((data.role?.toLowerCase() as UserRole) || selectedRole);
        const next = (data.role?.toLowerCase() as UserRole) === "caregiver" ? "/dashboard/caregiver" : "/dashboard/home";
        router.push(next);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (authMode === "sign_in") {
        if (msg.includes("401") || msg.includes("403")) {
          setAuthError("Invalid email or password.");
        } else {
          setAuthError("Login failed. Check your credentials.");
        }
      } else {
        if (msg.includes("already") || msg.includes("Email already")) {
          setAuthError("Email already registered. Try signing in.");
        } else {
          setAuthError(`Registration failed: ${msg.includes('{') ? 'Invalid details provided.' : msg}`);
        }
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const inputCls =
    "w-full bg-surface/30 border border-card-border rounded-xl px-4 py-3 text-base font-medium text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all";

  return (
    <div className="relative min-h-screen w-full bg-background lg:h-screen lg:overflow-hidden">

      {/* Left Panel */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-1/2 relative bg-surface flex-col justify-between p-12 overflow-hidden border-r border-card-border/50">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,_rgba(108,140,255,0.15)_0%,_transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,_rgba(56,217,169,0.1)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Vital<span className="text-primary">Sync</span></h1>
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <Quote className="w-12 h-12 text-primary/30 mb-6" />
          <h2 className="text-4xl font-bold leading-tight mb-6">Connecting care, <br />empowering health.</h2>
          <p className="text-lg text-muted mb-12">
            A seamless platform bringing patients and caregivers together. Monitor vitals, track medications, and receive AI-driven insights in one unified experience.
          </p>
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-muted">HIPAA Secure</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-muted">AI Insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:ml-[50%] lg:w-1/2 min-h-screen lg:h-screen lg:overflow-y-auto flex items-start lg:items-center justify-center p-6 md:p-12 relative">
        <AnimatePresence mode="wait">

          {/* STEP 1: ROLE */}
          {step === "role" && (
            <motion.div key="role-selection" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
              <div className="mb-10 text-center lg:text-left">
                <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">Vital<span className="text-primary">Sync</span></h1>
                </div>
                <h2 className="text-3xl font-bold mb-3 mt-4">Welcome to VitalSync</h2>
                <p className="text-muted text-lg">Select your account type to proceed.</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => handleRoleSelect("patient")} className="w-full group p-6 rounded-2xl border border-card-border/60 bg-surface/50 hover:bg-surface hover:border-primary/50 transition-all text-left flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-300">
                      <User className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Patient</h3>
                      <p className="text-sm text-muted">Manage your personal health data</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-muted rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
                <button onClick={() => handleRoleSelect("caregiver")} className="w-full group p-6 rounded-2xl border border-card-border/60 bg-surface/50 hover:bg-surface hover:border-accent/50 transition-all text-left flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent transition-all duration-300">
                      <HeartHandshake className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Caregiver</h3>
                      <p className="text-sm text-muted">Monitor patients and family</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-muted rotate-180 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AUTH */}
          {step === "auth" && (
            <motion.div key="auth-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
              <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted hover:text-foreground font-semibold transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
              </button>
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight capitalize mb-2">
                  {selectedRole} {authMode === "sign_up" ? "Sign Up" : "Sign In"}
                </h2>
                <p className="text-muted">
                  {authMode === "sign_up"
                    ? "Create a new account for your VitalSync journey."
                    : "Sign in to your existing account."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-surface/40 border border-card-border rounded-xl p-1 mb-6">
                <button onClick={() => { setAuthMode("sign_in"); setAuthError(""); }} className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${authMode === "sign_in" ? "bg-primary text-white" : "text-muted hover:text-foreground"}`}>Sign In</button>
                <button onClick={() => { setAuthMode("sign_up"); setAuthError(""); }} className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${authMode === "sign_up" ? "bg-primary text-white" : "text-muted hover:text-foreground"}`}>Sign Up</button>
              </div>

              <div className="space-y-4">
                {authMode === "sign_up" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <label className="block text-sm font-semibold text-muted mb-2">Full Name</label>
                    <input type="text" value={fullName} onChange={e => { setFullName(e.target.value); setAuthError(""); }} placeholder="Full Name" className={inputCls} />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">Email</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setAuthError(""); }} placeholder="you@example.com" className={inputCls} onKeyDown={e => e.key === "Enter" && handleAuthSubmit()} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setAuthError(""); }} placeholder="••••••••" className={`${inputCls} pr-12`} onKeyDown={e => e.key === "Enter" && handleAuthSubmit()} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {authMode === "sign_up" && <p className="text-xs text-muted mt-2">Must be at least 8 characters long.</p>}
                </div>

                {authMode === "sign_up" && selectedRole === "caregiver" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-sm font-semibold text-muted mb-2">Pair Code</label>
                    <input
                      type="text"
                      value={pairCode}
                      onChange={(e) => {
                        setPairCode(e.target.value.toUpperCase());
                        setAuthError("");
                      }}
                      placeholder="Enter patient invite code (e.g. A1B2C3D4)"
                      className={inputCls}
                    />
                    <p className="text-xs text-muted mt-2">
                      Ask the patient to generate an invite code from Profile.
                    </p>
                  </motion.div>
                )}
 
                <AnimatePresence>
                  {authError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-start gap-2 p-4 rounded-xl bg-danger/10 text-danger text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={handleAuthSubmit} disabled={isAuthLoading} className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                  {isAuthLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> {authMode === "sign_in" ? "Signing in..." : "Continuing..."}</> : (authMode === "sign_in" ? "Sign In" : "Continue")}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
