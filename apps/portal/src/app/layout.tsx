import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/inter";
import "./globals.css";
import { PortalShell } from "@/components/PortalShell";

export const metadata: Metadata = {
  title: "Millar · Hahlex Design System",
  description:
    "Official Hahlex Design System: Shared Foundations, Photo-Free Marketing Visual Language, Accessible Product Primitives, Agent Skills Suite, and Millar MCP Server.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
