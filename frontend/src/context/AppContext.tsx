"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "patient" | "caregiver" | null;

export interface Medicine {
  id: number;
  name: string;
  dosage: string;
  time: string; // e.g., "08:00 AM"
  period: "morning" | "afternoon" | "evening" | "night";
  duration: string;
  taken: boolean;
}

export interface Report {
  id: number;
  date: string;
  type: string;
  status: string;
  issues: number;
  importantData: string;
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
  | "caregiver_hub";

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
  
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, name: "Aspirin", dosage: "100mg", time: "08:00 AM", period: "morning", duration: "30 days", taken: true },
    { id: 2, name: "Metformin", dosage: "500mg", time: "01:00 PM", period: "afternoon", duration: "90 days", taken: false },
    { id: 3, name: "Atorvastatin", dosage: "20mg", time: "08:00 PM", period: "evening", duration: "Ongoing", taken: false },
  ]);

  const [reports, setReports] = useState<Report[]>([
    { 
      id: 1, 
      date: "Mar 10, 2026", 
      type: "Blood Work", 
      status: "Analysis Complete", 
      issues: 1,
      importantData: "LDL Cholesterol: 110 mg/dL",
      insight: { type: "alert", message: "Slightly elevated. Reduce saturated fats." }
    },
    { 
      id: 2, 
      date: "Feb 15, 2026", 
      type: "ECG Scan", 
      status: "Normal", 
      issues: 0,
      importantData: "Heart Rate: 72 BPM",
      insight: { type: "stable", message: "Normal sinus rhythm detected." }
    },
  ]);

  const [theme, setTheme] = useState<"dark" | "light">("dark");

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
