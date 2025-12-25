import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { SubscriptionGuard } from "@/components/subscription-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parallel Universe - AI-Powered X Growth Platform",
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
        <body>
          <SubscriptionGuard>
            {children}
          </SubscriptionGuard>
        </body>
      </html>
    </ClerkProvider>
  );
}
