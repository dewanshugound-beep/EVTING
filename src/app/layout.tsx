import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import BroadcastListener from "@/components/BroadcastListener";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import VisitorTracker from "@/components/VisitorTracker";

export const viewport = {
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  title: "MatrixIN — Build. Share. Connect.",
  description: "The all-in-one developer platform. Discover tools, share your work, and connect with your community. Store, Social Feed, and Real-time Chat.",
  manifest: "/manifest.json",
  openGraph: {
    title: "MatrixIN — The Developer Platform",
    description: "Store, Social Feed, and Real-time Chat for developers, hackers, and creators.",
    url: "https://evting.vercel.app",
    siteName: "MatrixIN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatrixIN — The Developer Platform",
    description: "Store, Social Feed, and Real-time Chat for developers, hackers, and creators.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "cu3EgStZQOg_jHkeKlVonNIHAm96mxAJESf6AdYbhXg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#0a0a0f",
          colorInputBackground: "#111118",
          colorText: "#e4e4e7",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      >
        <body className="min-h-full bg-background text-foreground">
          <VisitorTracker />
          <BroadcastListener />
          <Sidebar />
          <Navbar />
          <main className="ml-[68px] pt-14">
            <PageTransition>{children}</PageTransition>
          </main>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111118",
                border: "1px solid #1a1a2e",
                color: "#e4e4e7",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
