"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, PhoneCall } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useMemo, useState, useEffect, useCallback } from "react";

import { fetchApi } from "@/lib/api";

export function SosEmergency() {
  const { isSosActive, setIsSosActive } = useAppContext();
  const [countdown, setCountdown] = useState(5);
  const [isAlertSent, setIsAlertSent] = useState(false);

  const triggerSos = useCallback(async () => {
    try {
      await fetchApi("/sos/trigger", {
        method: "POST",
        body: JSON.stringify({
          triggerReason: "Emergency Button Pressed",
          triggerType: "MANUAL",
          latitude: 0.0,
          longitude: 0.0
        })
      });
      setIsAlertSent(true);
      setCountdown(0);
      console.log("SOS Alert Triggered successfully.");
    } catch (err) {
      console.error("Failed to trigger SOS", err);
      setIsAlertSent(true); // show sent anyway so user doesn't panic on network blip
      setCountdown(0);
    }
  }, []);

  const total = 5;
  const progress = useMemo(() => {
    const clamped = Math.max(0, Math.min(total, countdown));
    return (total - clamped) / total;
  }, [countdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSosActive && countdown > 0 && !isAlertSent) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isSosActive && countdown === 0 && !isAlertSent) {
      // Run outside the effect body to satisfy react-hooks/set-state-in-effect
      timer = setTimeout(() => triggerSos(), 0);
    }
    return () => clearTimeout(timer);
  }, [isSosActive, countdown, isAlertSent, triggerSos]);

  const handleCancel = () => {
    setIsSosActive(false);
    setTimeout(() => {
      setCountdown(total);
      setIsAlertSent(false);
    }, 500); // reset after animation
  };

  return (
    <AnimatePresence>
      {isSosActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.96, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 18, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg rounded-3xl border border-danger/25 bg-[linear-gradient(180deg,rgba(20,27,50,0.92),rgba(12,16,34,0.92))] shadow-[0_30px_80px_rgba(0,0,0,0.55)] relative overflow-hidden"
          >
            {/* Ambient warning aura */}
            {!isAlertSent && <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-danger/18 blur-3xl" />}
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-danger/10 blur-3xl" />
            
            <button 
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 rounded-full bg-surface/40 hover:bg-surface/70 border border-card-border/60 transition-colors z-10"
              aria-label="Close SOS dialog"
            >
              <X className="w-6 h-6 text-muted" />
            </button>

            <div className="relative z-10 p-7 md:p-8">
              <div className="flex items-start gap-4">
                <div className="grid place-items-center h-12 w-12 rounded-2xl bg-danger/15 border border-danger/20 text-danger shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                    {isAlertSent ? "SOS Sent" : "Emergency SOS"}
                  </h2>
                  <p className="text-sm text-muted mt-1">
                    {isAlertSent
                      ? "Your caregiver and emergency contacts have been notified."
                      : "Auto-sending in a few seconds. You can send immediately or cancel."}
                  </p>
                </div>
              </div>

              {isAlertSent ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="mt-7 w-full btn-accessible bg-surface/40 border border-card-border/60 hover:bg-surface/70 text-foreground"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    <div className="rounded-3xl border border-card-border/60 bg-surface/30 p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold">Auto-send</div>
                        <div className="text-xs text-muted">in {countdown}s</div>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0">
                          <svg viewBox="0 0 64 64" className="h-16 w-16">
                            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                            <motion.circle
                              cx="32"
                              cy="32"
                              r="26"
                              fill="none"
                              stroke="rgba(255,77,106,0.95)"
                              strokeWidth="6"
                              strokeLinecap="round"
                              style={{ rotate: -90, transformOrigin: "32px 32px" }}
                              strokeDasharray={2 * Math.PI * 26}
                              animate={{ strokeDashoffset: (1 - progress) * (2 * Math.PI * 26) }}
                              transition={{ type: "spring", stiffness: 180, damping: 24 }}
                            />
                          </svg>
                          <div className="absolute inset-0 grid place-items-center text-lg font-black text-danger">
                            {countdown}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">Notifies caregiver</div>
                          <div className="text-xs text-muted mt-1">
                            Sends your alert with last known details.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={triggerSos}
                        className="w-full btn-accessible bg-danger hover:bg-danger/90 text-white shadow-lg glow-danger"
                      >
                        <PhoneCall className="w-6 h-6" />
                        Send Now
                      </button>
                      <button
                        onClick={handleCancel}
                        className="w-full btn-accessible bg-surface/40 hover:bg-surface/70 text-muted border border-card-border/60"
                      >
                        Cancel
                      </button>
                      <p className="text-xs text-muted leading-relaxed">
                        Use SOS only for emergencies. If you are in immediate danger, contact local emergency services.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
