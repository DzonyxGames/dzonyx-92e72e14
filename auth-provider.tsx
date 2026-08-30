"use client";

import { ClerkProvider } from "@clerk/react";
import { Toaster } from "@/components/ui/sonner";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/public-config";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? CLERK_PUBLISHABLE_KEY;
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInFallbackRedirectUrl="/library"
      signUpFallbackRedirectUrl="/library"
      appearance={{
        variables: {
          colorPrimary: "#f15a24",
          colorBackground: "#151412",
          colorForeground: "#f4eddc",
          colorMutedForeground: "#aaa399",
          borderRadius: "3px",
        },
        elements: {
          cardBox: "shadow-none",
          card: "border border-white/10 shadow-2xl",
          headerTitle: "font-black uppercase tracking-tight",
          footerActionLink: "text-orange-500",
        },
      }}
    >
      {children}
      <Toaster richColors position="bottom-right" />
    </ClerkProvider>
  );
}
