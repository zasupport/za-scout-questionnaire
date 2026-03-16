import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZA Support — Health Check Scout Assessment",
  description:
    "Assess your Mac's security, backup status, and compliance posture in under 5 minutes. Receive a personalised risk report.",
  keywords: ["Mac", "IT security", "health check", "ZA Support", "Apple", "South Africa"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
