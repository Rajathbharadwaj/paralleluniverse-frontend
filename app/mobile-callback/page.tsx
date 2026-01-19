'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function MobileCallbackPage() {
  const { isSignedIn, getToken } = useAuth()
  const [status, setStatus] = useState('Checking authentication...')
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    async function handleAuth() {
      if (isSignedIn && !redirected) {
        setStatus('Getting your session...')

        try {
          const token = await getToken()

          if (token) {
            setStatus('Redirecting to app...')
            setRedirected(true)

            // Redirect to iOS app with token
            const redirectUrl = `paralleluniverse://auth-callback?token=${encodeURIComponent(token)}`
            window.location.href = redirectUrl

            // Fallback message after a delay
            setTimeout(() => {
              setStatus('If the app didn\'t open, please open it manually. You\'re now signed in!')
            }, 2000)
          } else {
            setStatus('Could not get session token. Please try signing in again.')
          }
        } catch (error) {
          console.error('Error getting token:', error)
          setStatus('Error getting session. Please try again.')
        }
      } else if (!isSignedIn) {
        setStatus('Please sign in first')
        // Redirect to sign in
        setTimeout(() => {
          window.location.href = '/sign-in?redirect_url=/mobile-callback'
        }, 1500)
      }
    }

    handleAuth()
  }, [isSignedIn, getToken, redirected])

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-white text-xl font-semibold mb-2">Parallel Universe</h1>
      <p className="text-zinc-400 text-center">{status}</p>

      {redirected && (
        <a
          href="paralleluniverse://auth-callback"
          className="mt-8 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium"
        >
          Open App
        </a>
      )}
    </div>
  )
}
