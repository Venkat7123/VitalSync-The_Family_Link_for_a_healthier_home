"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, HeartHandshake, ArrowLeft, Shield, Activity, Sparkles, Link2, Loader2, AlertCircle, Quote } from "lucide-react";
import { useAppContext, UserRole } from "@/context/AppContext";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type OnboardingStep = "role" | "auth" | "details" | "pairing";

export function OnboardingView() {
  const { setUserRole } = useAppContext();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<OnboardingStep>("role");

  // Details State
  const [fullName, setFullName] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Pairing State
  const [pairingCode, setPairingCode] = useState("");
  const [pairingError, setPairingError] = useState("");
  const [isPairingLoading, setIsPairingLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle the initial SIGNED_IN event
      if (event === "SIGNED_IN" && session && selectedRole) {
        // Check if the user already has their details filled out
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        if (profile && profile.full_name) {
          // Profile exists, proceed to next step
          if (selectedRole === "caregiver") {
            setStep("pairing");
          } else {
            router.push("/dashboard/home");
          }
        } else {
          // Need to collect details
          setStep("details");
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [selectedRole, router]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setUserRole(role);
    setStep("auth");
  };

  const handleBack = () => {
    if (step === "pairing") {
      setStep("details"); // They shouldn't really go back but let's allow it
    } else if (step === "details") {
      // Normally shouldn't go back to auth easily without signing out, but we can reset
      supabase.auth.signOut();
      setStep("auth");
    } else {
      setSelectedRole(null);
      setStep("role");
    }
  };

  const handleDetailsSubmit = async () => {
    const name = fullName.trim();
    if (!name) {
      setDetailsError("Please enter your full name.");
      return;
    }

    setIsDetailsLoading(true);
    setDetailsError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDetailsError("Authentication error.");
        setIsDetailsLoading(false);
        return;
      }

      // Update the profile with the selected role and full name
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          role: selectedRole,
        })
        .eq("id", user.id);

      if (error) {
        setDetailsError("Failed to save details. Please try again.");
        setIsDetailsLoading(false);
        return;
      }

      if (selectedRole === "caregiver") {
        setStep("pairing");
      } else {
        router.push("/dashboard/home");
      }
    } catch (err) {
      setDetailsError("An unexpected error occurred.");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handlePairingSubmit = async () => {
    const code = pairingCode.trim().toUpperCase();
    if (!code) {
      setPairingError("Please enter a pairing code.");
      return;
    }

    setIsPairingLoading(true);
    setPairingError("");

    try {
      const { data: patient, error: lookupError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("pairing_code", code)
        .eq("role", "patient")
        .single();

      if (lookupError || !patient) {
        setPairingError("Invalid code. Please ask the patient for their code.");
        setIsPairingLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPairingError("Authentication error.");
        setIsPairingLoading(false);
        return;
      }

      const { error: linkError } = await supabase
        .from("caregiver_patient_links")
        .upsert({
          caregiver_id: user.id,
          patient_id: patient.id,
          status: "active",
        }, { onConflict: "caregiver_id,patient_id" });

      if (linkError) {
        setPairingError("Failed to link accounts.");
        setIsPairingLoading(false);
        return;
      }

      router.push("/dashboard/home");
    } catch (err) {
      setPairingError("Something went wrong.");
      setIsPairingLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
      
      {/* Left Panel - Branding (Hidden on small screens) */}
      <div className="hidden lg:flex w-1/2 relative bg-surface flex-col justify-between p-12 overflow-hidden border-r border-card-border/50">
        <div className="absolute inset-0 z-0">
           {/* Sophisticated abstract gradient background */}
           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,_rgba(108,140,255,0.15)_0%,_transparent_50%)]" />
           <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,_rgba(56,217,169,0.1)_0%,_transparent_50%)]" />
           
           {/* Subtle tech pattern */}
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
            <h1 className="text-3xl font-black tracking-tight">
              Vital<span className="text-primary">Sync</span>
            </h1>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <Quote className="w-12 h-12 text-primary/30 mb-6" />
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Connecting care, <br />
            empowering health.
          </h2>
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

      {/* Right Panel - Interactive Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <AnimatePresence mode="wait">
          
          {/* ================= STEP 1: ROLE SELECTION ================= */}
          {step === "role" && (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <div className="mb-10 text-center lg:text-left">
                <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">
                    Vital<span className="text-primary">Sync</span>
                  </h1>
                </div>

                <h2 className="text-3xl font-bold mb-3 mt-4">Welcome back</h2>
                <p className="text-muted text-lg">Select your account type to proceed.</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect("patient")}
                  className="w-full group p-6 rounded-2xl border border-card-border/60 bg-surface/50 hover:bg-surface hover:border-primary/50 transition-all text-left flex items-center justify-between"
                >
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

                <button
                  onClick={() => handleRoleSelect("caregiver")}
                  className="w-full group p-6 rounded-2xl border border-card-border/60 bg-surface/50 hover:bg-surface hover:border-accent/50 transition-all text-left flex items-center justify-between"
                >
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

          {/* ================= STEP 2: AUTH ================= */}
          {step === "auth" && (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground font-semibold transition-colors mb-8 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Back
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight capitalize mb-2">
                  {selectedRole} Login
                </h2>
                <p className="text-muted">Enter your details to sign in to your account.</p>
              </div>

              <div className="bg-background rounded-xl p-1">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ 
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: selectedRole === 'patient' ? '#6c8cff' : '#38d9a9',
                          brandAccent: selectedRole === 'patient' ? '#5a7aee' : '#2cc494',
                          inputBackground: 'transparent',
                          inputBorder: 'rgba(255, 255, 255, 0.1)',
                          inputText: '#f0f4ff',
                          inputPlaceholder: '#8892b0',
                        },
                        borderWidths: {
                          buttonBorderWidth: '0px',
                          inputBorderWidth: '1px',
                        },
                        radii: {
                          borderRadiusButton: '12px',
                          inputBorderRadius: '12px',
                        },
                        fontSizes: {
                          baseInputSize: '16px',
                          baseButtonSize: '16px',
                        },
                        space: {
                          inputPadding: '14px 16px',
                          buttonPadding: '14px 16px',
                        },
                      }
                    }
                  }}
                  theme="dark"
                  providers={[]}
                />
              </div>
            </motion.div>
          )}

          {/* ================= STEP 3: DETAILS ================= */}
          {step === "details" && (
            <motion.div
               key="details-view"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.4, ease: "easeOut" }}
               className="w-full max-w-md"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3">
                  Almost there
                </h2>
                <p className="text-muted text-lg">
                  Before we continue, please introduce yourself so we can personalize your experience.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setDetailsError("");
                    }}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-surface/30 border border-card-border rounded-xl px-4 py-3 text-lg font-medium text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary focus:bg-primary/5 transition-all"
                  />
                </div>

                <AnimatePresence>
                  {detailsError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 p-4 rounded-xl bg-danger/10 text-danger text-sm font-medium mt-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{detailsError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleDetailsSubmit}
                  disabled={isDetailsLoading || !fullName.trim()}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isDetailsLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 4: PAIRING ================= */}
          {step === "pairing" && (
            <motion.div
              key="pairing-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground font-semibold transition-colors mb-8 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Back
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3">
                  Patient Link
                </h2>
                <p className="text-muted text-lg">
                  Enter your patient's 7-character pairing code to access their health records.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={pairingCode}
                    onChange={(e) => {
                      setPairingCode(e.target.value.toUpperCase());
                      setPairingError("");
                    }}
                    placeholder="VS-XXXX"
                    maxLength={7}
                    className="w-full bg-surface/30 border-2 border-card-border rounded-2xl px-5 py-5 text-center text-3xl font-mono font-bold text-foreground uppercase tracking-[0.2em] placeholder:text-muted/30 placeholder:tracking-[0.1em] placeholder:font-medium focus:outline-none focus:border-accent focus:bg-accent/5 transition-all"
                  />
                </div>

                <AnimatePresence>
                  {pairingError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 p-4 rounded-xl bg-danger/10 text-danger text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{pairingError}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handlePairingSubmit}
                  disabled={isPairingLoading || pairingCode.trim().length !== 7}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-accent text-white hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPairingLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </button>
              </div>

              <div className="mt-8 bg-surface/50 rounded-xl p-5 border border-card-border/50">
                <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-accent" /> Need help?
                </p>
                <p className="text-sm text-muted leading-relaxed">
                  The patient can find their code inside the VitalSync app under <strong className="text-foreground">Settings &gt; Family & Caregiver Pairing</strong>.
                </p>
              </div>

              <div className="mt-6 text-center">
                 <button 
                  onClick={() => router.push("/dashboard/home")}
                  className="text-sm text-muted hover:text-foreground font-semibold transition-colors underline decoration-muted/30 underline-offset-4"
                >
                  Skip this step for now
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
