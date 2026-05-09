import type { Metadata } from "next";
import { Inter, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/scroll-progress";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gohan AI — Make your gym think.",
  description:
    "An AI personal trainer your gym's app can plug in. Conversational coaching, routines that update themselves, integrable in any existing app via MCP.",
  metadataBase: new URL("https://gohan-landing.vercel.app"),
  openGraph: {
    title: "Gohan AI — Make your gym think.",
    description:
      "An AI personal trainer your gym's app can plug in. Conversational coaching, routines that update themselves, integrable in any existing app via MCP.",
    type: "website",
    url: "https://gohan-landing.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gohan AI — Make your gym think.",
    description:
      "An AI personal trainer your gym's app can plug in.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable}`}
      >
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
