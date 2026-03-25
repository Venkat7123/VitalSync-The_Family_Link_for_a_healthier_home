"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "patient" | "caregiver" | null;

export interface Medicine {
  id: string | number;
  name: string;
  dosage: string;
  time: string; // e.g., "08:00 AM"
  period: "morning" | "afternoon" | "evening" | "night";
  duration: string;
  sessions?: Array<"morning" | "afternoon" | "evening" | "night">;
  foodRelation?: "before_food" | "after_food" | "with_food" | "anytime";
  foodOffsetMinutes?: number;
  days?: number;
  taken: boolean;
}

export interface Report {
  id: number;
  date: string;
  type: string;
  status: string;
  issues: number;
  importantData: string;
  fileUrl?: string;
  extractedMetrics?: string;
  rawExtractedText?: string;
  insight: {
    type: "improvement" | "alert" | "stable";
    message: string;
  };
}

export type AppView = 
  | "onboarding"
  | "home"
  | "profile"
  | "medicine"
  | "intelligence"
  | "diet"
  | "appointments"
  | "progress"
  | "sos"
  | "caregiver"
  | "caregiver_hub"; // legacy

interface AppContextProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isSosActive: boolean;
  setIsSosActive: (active: boolean) => void;
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<AppView>("onboarding");
  const [isSosActive, setIsSosActive] = useState(false);
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  React.useEffect(() => {
    // Restore role on refresh (auth is stored in localStorage by api.ts).
    try {
      const stored = localStorage.getItem("vs_user");
      if (!stored) return;
      const parsed = JSON.parse(stored) as { role?: string } | null;
      const role = (parsed?.role || "").toLowerCase();
      if (role === "patient" || role === "caregiver") {
        setUserRole(role);
      }
    } catch {
      // Ignore invalid storage state.
    }
  }, []);

  React.useEffect(() => {
    // Check local storage on mount
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("light", savedTheme === "light");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("light", newTheme === "light");
      return newTheme;
    });
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        currentView,
        setCurrentView,
        isSosActive,
        setIsSosActive,
        medicines,
        setMedicines,
        reports,
        setReports,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
