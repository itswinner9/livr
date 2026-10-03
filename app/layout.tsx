import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CompareTray } from "@/components/compare-tray";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { organizationJsonLd, rootMetadata } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <JsonLd data={organizationJsonLd()} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <CompareTray />
        <SiteFooter />
      </body>
    </html>
  );
}
