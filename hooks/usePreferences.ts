import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { getApiUrl } from "@/lib/config";

const API_BASE_URL = typeof window !== 'undefined'
  ? getApiUrl('backend')
  : (process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || "http://localhost:8002");

// Voice style options for Step 1
export type VoiceStyle = "analytical" | "curious" | "opinionated" | "educational" | "casual" | "minimal";

// Primary intent options for Step 1
export type PrimaryIntent = "stay_present" | "keep_up" | "avoid_missing" | "reduce_load" | "experiment";

// AI initiation comfort level
export type AIInitiationComfort = "only_safe" | "conservative" | "balanced" | "later";

// Topics to never engage with (Step 2)
export type NeverEngageTopic =
  | "politics"
  | "religion"
  | "sexual_content"
  | "mental_health"
  | "personal_relationships"
  | "controversial_social"
  | "legal_medical"
  | "drama";

// Debate preference
export type DebatePreference = "avoid" | "light" | "balanced" | "case_by_case";

// Reply frequency (Step 3)
export type ReplyFrequency = "very_limited" | "conservative" | "moderate" | "later";

// Active hours type
export type ActiveHoursType = "my_daytime" | "specific" | "always_observe" | "later";

// Priority post types
export type PriorityPostType = "technical" | "threads_im_in" | "following" | "expertise" | "high_signal";

// Uncertainty action (Step 4)
export type UncertaintyAction = "do_nothing" | "save_review" | "reply_cautious" | "dynamic";

// Emotional post handling
export type EmotionalPostHandling = "never" | "observe" | "neutral_only";

// Worse outcome preference (calibrates entire system)
export type WorseOutcome = "miss_opportunity" | "post_off";

// Review before post
export type ReviewBeforePost = "no" | "yes_notify" | "low_confidence";

export interface UserPreferences {
  user_id: string;
  auto_post_enabled: boolean;
  aggression_level: "conservative" | "moderate" | "aggressive";
  niche: string[];
  target_audience: string;
  growth_goal: string;
  engagement_style: string;
  tone: string;
  daily_limits: Record<string, number>;
  optimal_times: string[];
  avoid_topics: string[];
  thread_topics: string[] | null;
  // Onboarding tracking (feature tour)
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;

  // ========================================================================
  // NEW: Preferences Onboarding Fields (4-step wizard)
  // ========================================================================

  // Step 1: Voice & Intent
  voice_styles?: VoiceStyle[] | null;
  primary_intent?: PrimaryIntent;
  ai_initiation_comfort?: AIInitiationComfort;

  // Step 2: Hard Guardrails
  never_engage_topics?: NeverEngageTopic[] | null;
  debate_preference?: DebatePreference;
  blocked_accounts?: string[] | null;

  // Step 3: Engagement Boundaries
  reply_frequency?: ReplyFrequency;
  active_hours_type?: ActiveHoursType;
  active_hours_range?: { start: string; end: string; tz: string } | null;
  priority_post_types?: PriorityPostType[] | null;

  // Step 4: Risk & Restraint
  uncertainty_action?: UncertaintyAction;
  emotional_post_handling?: EmotionalPostHandling;
  worse_outcome?: WorseOutcome;

  // Post-onboarding (optional advanced settings)
  review_before_post?: ReviewBeforePost;
  weekly_summary_enabled?: boolean;

  // Preferences onboarding tracking (separate from feature tour)
  preferences_onboarding_completed?: boolean;
  preferences_onboarding_completed_at?: string | null;
}

export function usePreferences() {
  const { getToken } = useAuth();

  return useSWR<{ success: boolean; preferences: UserPreferences }>(
    `${API_BASE_URL}/api/preferences`,
    async (url: string) => {
      const token = await getToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      return response.json();
    },
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );
}

export async function updatePreferences(
  data: Partial<UserPreferences>,
  token: string
): Promise<{ success: boolean; preferences: UserPreferences }> {
  const response = await fetch(`${API_BASE_URL}/api/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update preferences");
  }

  return response.json();
}
