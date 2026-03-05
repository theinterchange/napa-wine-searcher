"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { CompareProvider } from "@/components/compare/CompareContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <CompareProvider>{children}</CompareProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
