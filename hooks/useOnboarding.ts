/**
 * Onboarding Hook
 *
 * Manages onboarding state with hybrid persistence:
 * - localStorage (primary, immediate)
 * - Backend preferences API (durable, cross-device)
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { usePreferences, updatePreferences } from "./usePreferences";
import { useSubscription } from "./useSubscription";

const STORAGE_KEY_PREFIX = "onboarding_completed_";
const STORAGE_KEY_AT_PREFIX = "onboarding_completed_at_";

export function useOnboarding() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { data: preferencesData, mutate: mutatePreferences } = usePreferences();
  const { data: subscription } = useSubscription();
  const [localCompleted, setLocalCompleted] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);

  const userId = user?.id;
  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : null;
  const storageKeyAt = userId ? `${STORAGE_KEY_AT_PREFIX}${userId}` : null;

  // Check localStorage on mount
  useEffect(() => {
    if (!storageKey) {
      setIsReady(true);
      return;
    }

    const stored = localStorage.getItem(storageKey);
    setLocalCompleted(stored === "true");
    setIsReady(true);
  }, [storageKey]);

  // Determine if onboarding should be shown
  const shouldShowOnboarding = useMemo(() => {
    // Not ready yet
    if (!isReady || !userId) return false;

    // User must have an active subscription
    if (!subscription?.has_subscription) return false;

    // Check localStorage first (faster)
    if (localCompleted === true) return false;

    // Fallback to backend preferences
    if (preferencesData?.preferences?.onboarding_completed === true) {
      // Sync to localStorage if backend says completed
      if (storageKey && localCompleted === false) {
        localStorage.setItem(storageKey, "true");
        setLocalCompleted(true);
      }
      return false;
    }

    return true;
  }, [isReady, userId, subscription?.has_subscription, localCompleted, preferencesData?.preferences?.onboarding_completed, storageKey]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!userId || !storageKey || !storageKeyAt) return;

    const completedAt = new Date().toISOString();

    // Save to localStorage immediately
    localStorage.setItem(storageKey, "true");
    localStorage.setItem(storageKeyAt, completedAt);
    setLocalCompleted(true);

    // Persist to backend
    try {
      const token = await getToken();
      if (token) {
        await updatePreferences(
          {
            onboarding_completed: true,
            onboarding_completed_at: completedAt,
          },
          token
        );
        await mutatePreferences();
      }
    } catch (error) {
      console.error("Failed to persist onboarding state to backend:", error);
      // localStorage already saved, so user won't see wizard again
    }
  }, [userId, storageKey, storageKeyAt, getToken, mutatePreferences]);

  // Replay tour (for "Replay Tour" button in header)
  const replayTour = useCallback(() => {
    if (!storageKey || !storageKeyAt) return;

    // Clear localStorage
    localStorage.removeItem(storageKey);
    localStorage.removeItem(storageKeyAt);
    setLocalCompleted(false);

    // Note: We don't update backend here - just show the tour again locally
    // The tour will be marked complete again when they finish it
  }, [storageKey, storageKeyAt]);

  return {
    shouldShowOnboarding,
    completeOnboarding,
    replayTour,
    isReady,
  };
}
