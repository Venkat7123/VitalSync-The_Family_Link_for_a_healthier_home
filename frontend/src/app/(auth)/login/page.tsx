"use client";

import { OnboardingView } from "@/components/OnboardingView";
import { Providers } from "@/context/Providers";

export default function LoginPage() {
  return (
    <Providers>
      <OnboardingView />
    </Providers>
  );
}