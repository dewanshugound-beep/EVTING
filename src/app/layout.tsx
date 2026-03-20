import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
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
  title: "EVTING HUB — The Dev Hub",
  description:
    "Where elite developers drop code and talk. Encrypted vault, real-time chat, and curated dev resources.",
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
