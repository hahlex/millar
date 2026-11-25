import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { PortalShell } from "@/components/PortalShell";

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--next-font-geist",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--next-font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--next-font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Millar · Hahlex Design System",
  description:
    "Official Hahlex Design System: Shared Foundations, Photo-Free Marketing Visual Language, Accessible Product Primitives, and Millar MCP Server.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${geist.variable} ${inter.variable} ${geistMono.variable}`}>
      <body>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
