"use client";

import { useAppContext } from "@/context/AppContext";
import { OnboardingView } from "@/components/OnboardingView";
import { Sidebar } from "@/components/Sidebar";
import { SosEmergency } from "@/components/SosEmergency";
import { ProfileView } from "@/components/ProfileView";
import { MedicineView } from "@/components/MedicineView";
import { IntelligenceView } from "@/components/IntelligenceView";
import { DietView } from "@/components/DietView";
import { AppointmentsView } from "@/components/AppointmentsView";
import { ProgressView } from "@/components/ProgressView";
import { CaregiverHubView } from "@/components/CaregiverHubView";
import { HomeView } from "@/components/HomeView";
import { motion, AnimatePresence } from "framer-motion";

export function MainApp() {
  const { currentView } = useAppContext();

  // Basic routing based on state
  const renderView = () => {
    switch (currentView) {
      case "onboarding":
        return <OnboardingView key="onboarding" />;
      case "home":
        return <HomeView key="home" />;
      case "profile":
        return <ProfileView key="profile" />;
      case "medicine":
        return <MedicineView key="medicine" />;
      case "intelligence":
        return <IntelligenceView key="intelligence" />;
      case "diet":
        return <DietView key="diet" />;
      case "appointments":
        return <AppointmentsView key="appointments" />;
      case "progress":
        return <ProgressView key="progress" />;
      case "caregiver_hub":
        return <CaregiverHubView key="caregiver_hub" />;
      // Add other views here as they are built
      default:
        return <OnboardingView key="default_onboarding" />;
    }
  };

  return (
    <div className="relative min-h-screen flex w-full">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 w-full ${currentView !== 'onboarding' ? 'md:ml-72' : ''}`}>
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>
      <SosEmergency />
    </div>
  );
}
