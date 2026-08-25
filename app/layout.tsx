import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const bodySans = Inter({
  variable: "--font-body-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Instant Garage Floor Estimate | GarageExperts of Portland",
  description:
    "Get an instant Silver, Gold, or Platinum Garage FX floor coating estimate for your Portland-area garage in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodySans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
