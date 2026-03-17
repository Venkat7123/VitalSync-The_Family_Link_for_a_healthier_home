"use client";

import { ReactNode } from "react";
import { AppProvider } from "./AppContext";

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
