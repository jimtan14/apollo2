import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Search ROI Calculator | AirOps",
  description:
    "Your brand is invisible in AI search. This calculator shows you exactly how much revenue that costs. Built by AirOps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
