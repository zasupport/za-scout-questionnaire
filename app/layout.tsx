import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://scout.zasupport.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B6B4A",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ZA Support — Health Check Scout Assessment",
    template: "%s | ZA Support",
  },
  description:
    "Assess your Mac's security, backup status, and compliance posture in under 5 minutes. Receive a personalised risk report from ZA Support.",
  keywords: [
    "Mac",
    "IT security",
    "health check",
    "ZA Support",
    "Apple",
    "South Africa",
    "POPIA",
  ],
  authors: [{ name: "ZA Support", url: "https://zasupport.com" }],
  creator: "ZA Support",
  publisher: "ZA Support",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: SITE_URL,
    siteName: "ZA Support",
    title: "Mac Security & Health Assessment — ZA Support",
    description:
      "Free 5-minute assessment of your Mac's security, backup, and POPIA compliance posture. Personalised risk score and action plan.",
  },
  twitter: {
    card: "summary",
    title: "Mac Security & Health Assessment — ZA Support",
    description:
      "Assess your Mac's security, backup, and compliance posture in under 5 minutes.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
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
