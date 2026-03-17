"use client";

import { motion } from "framer-motion";
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

export function Sidebar() {
  const { userRole, setIsSosActive, currentView } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

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
    { id: "home", label: "Dashboard", icon: Home },
    { id: "medicine", label: "Medicines", icon: Pill },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "diet", label: "Diet Plan", icon: Utensils },
    { id: "appointments", label: "Visits", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ];

  if (userRole === "caregiver") {
    navItems.push({ id: "caregiver", label: "Caregiver Hub", icon: Users });
  }

  navItems.push({ id: "profile", label: "Profile", icon: Settings });

  return (
    <>
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col w-72 h-screen glass-card fixed left-0 top-0 border-r border-t-0 border-b-0 border-l-0 rounded-none z-40"
      >
        <div className="p-6 pt-10 pb-8 flex items-center justify-between border-b border-card-border/50">
          <h2 className="text-2xl font-bold gradient-text tracking-tight">VitalSync</h2>
          <div className="px-3 py-1 rounded-full bg-surface text-xs font-semibold uppercase tracking-wider text-muted">
            {userRole || 'Guest'}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = getIsActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/20 text-primary font-medium" 
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted"}`} />
                <span className="text-lg">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {userRole === "patient" && (
          <div className="p-6 border-t border-card-border/50">
            <button 
              onClick={() => setIsSosActive(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-danger/10 text-danger rounded-xl font-bold tracking-wide hover:bg-danger hover:text-white transition-all glow-danger shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-danger/20 w-full transform -translate-x-full group-hover:animate-pulse"></div>
              <AlertCircle className="w-6 h-6" />
              <span>SOS EMERGENCY</span>
            </button>
          </div>
        )}
      </motion.aside>

      {/* Mobile Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 w-full h-20 glass-card rounded-t-3xl rounded-b-none border-t border-card-border z-40 flex items-center justify-around px-2 pb-safe"
      >
        {navItems.slice(0, 4).map((item) => {
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
        })}
        <button
          onClick={() => navigateTo("profile")}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
            getIsActive("profile") ? "text-primary bg-primary/10" : "text-muted"
          }`}
        >
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium tracking-tight">More</span>
        </button>
      </motion.nav>

      {userRole === "patient" && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsSosActive(true)}
          className="md:hidden fixed bottom-28 right-6 w-16 h-16 rounded-full bg-danger text-white flex items-center justify-center shadow-2xl glow-danger z-40"
        >
          <AlertCircle className="w-8 h-8" />
        </motion.button>
      )}
    </>
  );
}
