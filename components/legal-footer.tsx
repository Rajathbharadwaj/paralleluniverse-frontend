"use client";

import Link from "next/link";

interface LegalFooterProps {
  className?: string;
}

export function LegalFooter({ className }: LegalFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`py-6 border-t bg-background ${className || ""}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {currentYear} Parallel Universe. All rights reserved.</p>
          <nav className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <a
              href="mailto:support@paralleluniverse.ai"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
