import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dzonyx — Original digital comics",
    template: "%s | Dzonyx",
  },
  description:
    "Discover, collect and read original Dzonyx digital comics online.",
  icons: {
    icon: "/dzonyx-profile.svg",
    shortcut: "/dzonyx-profile.svg",
    apple: "/dzonyx-profile.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
