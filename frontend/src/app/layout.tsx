import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalSync — Smart Health Companion",
  description: "A dual-role health platform for patients and caregivers, designed with extreme accessibility for elderly users.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
