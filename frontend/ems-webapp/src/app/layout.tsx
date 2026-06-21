import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/lib/AuthContext";
import { ProfileProvider } from "@/lib/ProfileContext";
import { GoogleAnalytics } from "@next/third-parties/google";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ems.keyblocks.org";
const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EMS | Precision In Power",
    template: "%s | EMS",
  },
  description:
    "Monitor electricity usage, analyze building energy performance, and optimize power consumption with EMS.",
  keywords: [
    "energy management system",
    "power monitoring",
    "building energy analytics",
    "IoT energy monitoring",
    "electricity usage dashboard",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "EMS | Precision In Power",
    description:
      "Monitor electricity usage, analyze building energy performance, and optimize power consumption with EMS.",
    url: "/",
    siteName: "EMS",
    type: "website",
    images: [
      {
        url: "/hero_image.png",
        width: 1200,
        height: 630,
        alt: "EMS energy monitoring dashboard and solar building",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EMS | Precision In Power",
    description:
      "Monitor electricity usage, analyze building energy performance, and optimize power consumption with EMS.",
    images: ["/hero_image.png"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="..." suppressHydrationWarning>
        <AuthProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </AuthProvider>

        {googleAnalyticsId ? <GoogleAnalytics gaId={googleAnalyticsId} /> : null}
      </body>
    </html>
  );
}
