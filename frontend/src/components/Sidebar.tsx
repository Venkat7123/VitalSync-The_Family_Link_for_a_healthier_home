"use client";

import { AnimatePresence, motion } from "framer-motion";
import { 
  Home, 
  Pill, 
  FileText, 
  Utensils, 
  Calendar, 
  TrendingUp, 
  Users, 
  Settings,
  AlertCircle
} from "lucide-react";
import { useAppContext, AppView } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function Sidebar() {
  const { userRole, setIsSosActive, currentView } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  if (!userRole && pathname === "/login") return null;

  const getIsActive = (id: string) => {
    // legacy support alongside routing
    if (pathname.includes(id)) return true;
    if (currentView === id && pathname === "/") return true;
    return false;
  };

  const navigateTo = (id: string) => {
    router.push(`/dashboard/${id}`);
  };

  const navItems = [
    ...(userRole === "caregiver"
      ? [{ id: "caregiver", label: "Dashboard", icon: Users }]
      : [{ id: "home", label: "Dashboard", icon: Home }]),
    { id: "medicine", label: "Medicines", icon: Pill },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "diet", label: "Diet Plan", icon: Utensils },
    { id: "appointments", label: "Reminders", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  // caregiver dashboard is the hub (no separate extra item)

  navItems.push({ id: "profile", label: "Profile", icon: Settings });

  return (
    <>
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 z-40 border-r border-card-border/60 bg-[linear-gradient(180deg,rgba(20,27,50,0.92),rgba(12,16,34,0.92))] backdrop-blur-2xl"
      >
        <div className="relative p-6 pt-10 pb-8 flex items-center justify-between border-b border-card-border/50 overflow-hidden">
          {/* Subtle aura */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <h2 className="text-2xl font-black tracking-tight">
            <span className="gradient-text">Vital</span>
            <span className="text-foreground">Sync</span>
          </h2>
          {userRole && (
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-[11px] font-black uppercase tracking-wider text-primary">
              {userRole}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = getIsActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`group relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 text-left border ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-transparent border-transparent text-muted hover:bg-surface/60 hover:border-card-border/60 hover:text-foreground"
                }`}
              >
                {/* Active indicator */}
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded-r-full transition-opacity ${
                    isActive ? "opacity-100 bg-gradient-to-b from-primary to-accent" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />

                <span
                  className={`grid place-items-center h-9 w-9 rounded-xl border transition-colors ${
                    isActive
                      ? "bg-primary/15 border-primary/25 text-primary"
                      : "bg-surface/30 border-card-border/60 text-muted group-hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </span>

                <span className="text-[15px] font-semibold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {userRole === "patient" && (
          <div className="p-6 border-t border-card-border/50">
            <div className="rounded-3xl border border-danger/20 bg-gradient-to-br from-danger/10 via-surface/20 to-transparent p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black tracking-tight">Safety</div>
                  <div className="text-xs text-muted mt-1">Instantly notify your caregiver and contacts.</div>
                </div>
                <div className="h-2.5 w-2.5 rounded-full bg-danger shadow-[0_0_0_6px_rgba(255,77,106,0.12)]" />
              </div>
            <button 
              onClick={() => setIsSosActive(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black tracking-wide transition-all border border-danger/25 bg-danger/10 text-danger hover:bg-danger hover:text-white shadow-[0_10px_30px_rgba(255,77,106,0.12)]"
            >
              <AlertCircle className="w-6 h-6" />
                <span>Send SOS</span>
            </button>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Mobile Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 w-full h-20 glass-card rounded-t-3xl rounded-b-none border-t border-card-border z-40 flex items-center justify-around px-2 pb-safe"
      >
        {(() => {
          const mobilePrimaryIds: AppView[] = userRole === "caregiver"
            ? ["caregiver", "medicine", "appointments", "progress"]
            : ["home", "medicine", "appointments", "progress"];
          const mobilePrimary = navItems.filter((n) => mobilePrimaryIds.includes(n.id as AppView));
          return mobilePrimary.map((item) => {
            const isActive = getIsActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
                  isActive ? "text-primary bg-primary/10" : "text-muted"
                }`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          });
        })()}

        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
            isMobileMoreOpen ? "text-primary bg-primary/10" : "text-muted"
          }`}
        >
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">More</span>
        </button>
      </motion.nav>

      {/* Mobile "More" drawer */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMoreOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute left-4 right-4 bottom-24 glass-card rounded-3xl p-4 border border-card-border/60"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-1 pb-3">
                <div className="text-sm font-bold">More</div>
                <button
                  type="button"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const mobilePrimaryIds: AppView[] = userRole === "caregiver"
                    ? ["caregiver", "medicine", "appointments", "progress"]
                    : ["home", "medicine", "appointments", "progress"];
                  const secondary = navItems.filter(
                    (n) => !mobilePrimaryIds.includes(n.id as AppView) && n.id !== "profile"
                  );
                  const items = [...secondary, { id: "profile", label: "Profile", icon: Settings }];
                  return items.map((item) => {
                    const isActive = getIsActive(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setIsMobileMoreOpen(false);
                          navigateTo(item.id);
                        }}
                        className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                          isActive
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-card-border/60 bg-surface/30 hover:bg-surface/50"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted"}`} />
                        <div className="text-sm font-semibold">{item.label}</div>
                      </button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {userRole === "patient" && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsSosActive(true)}
          className="md:hidden fixed bottom-28 right-6 h-14 px-5 rounded-full bg-danger text-white flex items-center justify-center shadow-2xl glow-danger z-40 font-black tracking-wide"
        >
          <AlertCircle className="w-6 h-6 mr-2" />
          SOS
        </motion.button>
      )}
    </>
  );
}
