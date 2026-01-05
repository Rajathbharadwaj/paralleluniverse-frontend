import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm Your Demo - Parallel Universe",
  description: "Complete your booking for a voice AI demo",
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Standalone layout - no auth, no sidebar, no subscription guard
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
        {children}
      </body>
    </html>
  );
}
