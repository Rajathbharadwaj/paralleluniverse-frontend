'use client'

import { SignIn } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LegalFooter } from '@/components/legal-footer'

export default function Page() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Give Clerk time to load, then hide loading
    const timer = setTimeout(() => setIsLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-50">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Loading sign in...</p>
          </div>
        )}
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-zinc-800 shadow-xl border border-zinc-700"
            }
          }}
          fallbackRedirectUrl="/"
        />

        {/* Terms notice below signin form */}
        <p className="mt-6 text-sm text-zinc-400 text-center max-w-md px-4">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-blue-400 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <LegalFooter className="bg-zinc-900 border-zinc-800" />
    </div>
  )
}
