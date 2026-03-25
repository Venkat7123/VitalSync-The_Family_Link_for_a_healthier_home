"use client";

import { Sidebar } from "@/components/Sidebar";
import { SosEmergency } from "@/components/SosEmergency";
import { Providers } from "@/context/Providers";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Avoid hydration mismatch: server can't read localStorage, so we read token after mount.
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    // This is intentional: we need a post-mount snapshot of localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (token === null) return;
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  if (token === null || !token) {
    return null; // Return nothing while checking auth
  }

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
