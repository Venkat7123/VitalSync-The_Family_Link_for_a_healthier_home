"use client";

import { Sidebar } from "@/components/Sidebar";
import { SosEmergency } from "@/components/SosEmergency";
import { Providers } from "@/context/Providers";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Providers>
      <div className="relative min-h-screen flex w-full">
        <Sidebar />
        <main className="flex-1 transition-all duration-300 w-full md:ml-72 bg-background">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={pathname === "/dashboard/reports" ? "" : "p-6 pt-8 md:p-10 md:pt-12 max-w-[1600px] mx-auto"}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <SosEmergency />
      </div>
    </Providers>
  );
}