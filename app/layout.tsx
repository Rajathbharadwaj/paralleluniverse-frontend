import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "X Automation - Grow Your Account on Autopilot",
  description: "Automate likes, follows, and comments on X (Twitter) with AI-powered agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={inter.className}>
          <Script
            src="https://cdn.jsdelivr.net/npm/@novnc/novnc@1.4.0/core/rfb.js"
            strategy="beforeInteractive"
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
