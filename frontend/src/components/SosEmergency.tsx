"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, PhoneCall } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useState, useEffect } from "react";

export function SosEmergency() {
  const { isSosActive, setIsSosActive, userRole } = useAppContext();
  const [countdown, setCountdown] = useState(5);
  const [isAlertSent, setIsAlertSent] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSosActive && countdown > 0 && !isAlertSent) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isSosActive && countdown === 0 && !isAlertSent) {
      setIsAlertSent(true);
      // Here we would typically trigger the backend API to alert caregivers/emergency services
      console.log("SOS Alert Triggered!");
    }
    return () => clearTimeout(timer);
  }, [isSosActive, countdown, isAlertSent]);

  const handleCancel = () => {
    setIsSosActive(false);
    setTimeout(() => {
      setCountdown(5);
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
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-lg glass-card p-8 border-danger/50 shadow-2xl relative overflow-hidden"
          >
            {/* Pulsing Background Indicator */}
            {!isAlertSent && (
               <div className="absolute inset-0 bg-danger/10 sos-pulse rounded-3xl" />
            )}
            
            <button 
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 rounded-full bg-surface hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-6 h-6 text-muted" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-danger/20 flex items-center justify-center mb-6 relative">
                 <div className="absolute inset-0 border-4 border-danger rounded-full animate-ping opacity-75" />
                 <AlertTriangle className="w-12 h-12 text-danger" />
              </div>

              {isAlertSent ? (
                <>
                  <h2 className="text-3xl font-bold text-danger mb-4">Alert Sent</h2>
                  <p className="text-xl text-foreground mb-8">
                    Your caregiver and emergency contacts have been notified.
                  </p>
                  <button
                    onClick={handleCancel}
                    className="w-full btn-accessible bg-surface border border-card-border hover:bg-white/5 text-foreground"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-2">Emergency SOS</h2>
                  <p className="text-xl text-muted mb-8">
                    Alerting primary caregiver in...
                  </p>
                  
                  <div className="text-8xl font-black text-danger mb-8 tracking-tighter">
                    {countdown}
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                    <button
                      onClick={() => {
                        setIsAlertSent(true);
                        setCountdown(0);
                      }}
                      className="btn-accessible bg-danger hover:bg-danger/90 text-white shadow-lg glow-danger"
                    >
                       <PhoneCall className="w-6 h-6" />
                       Send Alert Now
                    </button>
                    <button
                       onClick={handleCancel}
                       className="btn-accessible bg-surface hover:bg-white/5 text-muted border border-card-border"
                    >
                       Cancel
                    </button>
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
