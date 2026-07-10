import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClinicQueue — Patient Scheduling & Real-Time Wait Dashboards",
  description: "Digital patient self-scheduling, contactless clinic check-in, and real-time wait-time tracking dashboards for modern healthcare centers.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ClinicQueue — Patient Scheduling & Real-Time Wait Dashboards",
    description: "Digital patient self-scheduling, contactless check-in, and real-time wait-time tracking.",
    url: "/",
    siteName: "ClinicQueue",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClinicQueue — Patient Scheduling & Real-Time Wait Dashboards",
    description: "Digital patient self-scheduling, contactless check-in, and real-time wait-time tracking.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-200">
        <Providers>
          <div className="flex-1 flex flex-col">{children}</div>
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
