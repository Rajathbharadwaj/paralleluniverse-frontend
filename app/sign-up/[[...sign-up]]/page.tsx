"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { LegalFooter } from "@/components/legal-footer";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <SignUp />

        {/* Terms notice below signup form */}
        <p className="mt-6 text-sm text-muted-foreground text-center max-w-md px-4">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <LegalFooter />
    </div>
  );
}
