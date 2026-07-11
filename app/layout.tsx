import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-200">
        <Providers>
          <div className="flex-1 flex flex-col">{children}</div>
          <ThemeToggle />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
