"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { TripBuilderProvider } from "@/components/trip/TripBuilderContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TripBuilderProvider>{children}</TripBuilderProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
