"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { VNC_BROWSER_URL } from "@/lib/config";

interface VNCSession {
  session_id: string;
  url: string;
  status: "starting" | "running" | "stopped";
  created_at: string;
  user_id: string;
}

interface UseVNCSessionResult {
  vncUrl: string | null;
  session: VNCSession | null;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

/**
 * Hook to fetch user-specific VNC session URL
 * Falls back to shared URL in development
 */
export function useVNCSession(): UseVNCSessionResult {
  const { getToken, isSignedIn } = useAuth();
  const [session, setSession] = useState<VNCSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    // In development, use the shared VNC URL
    if (process.env.NODE_ENV === "development") {
      setIsLoading(false);
      return;
    }

    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();

      const response = await fetch("/api/backend/api/vnc/session", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get VNC session: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.session) {
        setSession(data.session);
        console.log("✅ Got VNC session for user");
      } else {
        throw new Error("No session returned");
      }
    } catch (err: any) {
      console.error("❌ Error fetching VNC session:", err);
      setError(err.message);
      // Don't clear session on error - keep using cached one
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // In production, use user-specific URL; in dev, use shared URL
  const vncUrl = session?.url || (process.env.NODE_ENV === "development" ? VNC_BROWSER_URL : null);

  return {
    vncUrl,
    session,
    isLoading,
    error,
    refreshSession: fetchSession,
  };
}
