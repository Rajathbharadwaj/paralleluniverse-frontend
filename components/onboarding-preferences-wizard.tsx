"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Mic2,
  Shield,
  Activity,
  Scale,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import {
  updatePreferences,
  type VoiceStyle,
  type PrimaryIntent,
  type AIInitiationComfort,
  type NeverEngageTopic,
  type DebatePreference,
  type ReplyFrequency,
  type ActiveHoursType,
  type PriorityPostType,
  type UncertaintyAction,
  type EmotionalPostHandling,
  type WorseOutcome,
} from "@/hooks/usePreferences";

interface OnboardingPreferencesWizardProps {
  open: boolean;
  onComplete: () => void;
}

// Step 1 options
const VOICE_STYLES: { value: VoiceStyle; label: string; description: string }[] = [
  { value: "analytical", label: "Analytical", description: "Data-driven, logical" },
  { value: "curious", label: "Curious", description: "Asks questions, explores ideas" },
  { value: "opinionated", label: "Opinionated", description: "Clear stance, confident" },
  { value: "educational", label: "Educational", description: "Teaching, informative" },
  { value: "casual", label: "Casual", description: "Friendly, conversational" },
  { value: "minimal", label: "Minimal", description: "Brief, to the point" },
];

const PRIMARY_INTENTS: { value: PrimaryIntent; label: string; description: string }[] = [
  { value: "stay_present", label: "Stay Present", description: "Maintain visibility without constant effort" },
  { value: "keep_up", label: "Keep Up", description: "Stay on top of conversations in my niche" },
  { value: "avoid_missing", label: "Avoid Missing Out", description: "Don't miss important discussions" },
  { value: "reduce_load", label: "Reduce Load", description: "Handle routine engagement for me" },
  { value: "experiment", label: "Experiment", description: "See what AI engagement can do" },
];

const AI_INITIATION_OPTIONS: { value: AIInitiationComfort; label: string; description: string }[] = [
  { value: "only_safe", label: "Only Safe Replies", description: "Extremely conservative, low risk" },
  { value: "conservative", label: "Conservative", description: "Thoughtful, cautious engagement" },
  { value: "balanced", label: "Balanced", description: "Mix of caution and initiative" },
  { value: "later", label: "Decide Later", description: "I'll tune this in settings" },
];

// Step 2 options
const NEVER_ENGAGE_TOPICS: { value: NeverEngageTopic; label: string; description: string }[] = [
  { value: "politics", label: "Politics", description: "Elections, parties, politicians" },
  { value: "religion", label: "Religion", description: "Faith, religious debates" },
  { value: "sexual_content", label: "Sexual Content", description: "Adult or explicit content" },
  { value: "mental_health", label: "Mental Health", description: "Depression, anxiety, therapy" },
  { value: "personal_relationships", label: "Personal Relationships", description: "Dating, divorce, drama" },
  { value: "controversial_social", label: "Controversial Social Issues", description: "Hot-button debates" },
  { value: "legal_medical", label: "Legal/Medical Advice", description: "Diagnosis, legal counsel" },
  { value: "drama", label: "Drama & Beef", description: "Feuds, cancellations, exposures" },
];

const DEBATE_OPTIONS: { value: DebatePreference; label: string; description: string }[] = [
  { value: "avoid", label: "Avoid All", description: "Never disagree or debate" },
  { value: "light", label: "Light Only", description: "Gentle corrections, polite" },
  { value: "balanced", label: "Balanced", description: "Respectful disagreement OK" },
  { value: "case_by_case", label: "Case by Case", description: "Let AI decide contextually" },
];

// Step 3 options
const REPLY_FREQUENCY_OPTIONS: { value: ReplyFrequency; label: string; description: string }[] = [
  { value: "very_limited", label: "Very Limited", description: "Max 1-3 replies per day" },
  { value: "conservative", label: "Conservative", description: "3-5 replies per day" },
  { value: "moderate", label: "Moderate", description: "Up to 10 replies per day" },
  { value: "later", label: "Tune Later", description: "I'll adjust in settings" },
];

const ACTIVE_HOURS_OPTIONS: { value: ActiveHoursType; label: string; description: string }[] = [
  { value: "my_daytime", label: "My Daytime Hours", description: "9am-6pm in my timezone" },
  { value: "specific", label: "Specific Hours", description: "I'll set exact hours" },
  { value: "always_observe", label: "Always Observe", description: "Watch 24/7, but act conservatively" },
  { value: "later", label: "Configure Later", description: "Default to my daytime" },
];

const PRIORITY_POST_TYPES: { value: PriorityPostType; label: string; description: string }[] = [
  { value: "technical", label: "Technical Discussions", description: "In-depth topic conversations" },
  { value: "threads_im_in", label: "Threads I'm In", description: "Conversations I've started or joined" },
  { value: "following", label: "People I Follow", description: "Posts from my network" },
  { value: "expertise", label: "My Expertise Areas", description: "Topics I know well" },
  { value: "high_signal", label: "High-Signal Posts", description: "Viral or influential content" },
];

// Step 4 options
const UNCERTAINTY_OPTIONS: { value: UncertaintyAction; label: string; description: string }[] = [
  { value: "do_nothing", label: "Do Nothing", description: "Skip if any doubt (safest)" },
  { value: "save_review", label: "Save for Review", description: "Queue for my approval" },
  { value: "reply_cautious", label: "Reply Cautiously", description: "Proceed with extra care" },
  { value: "dynamic", label: "Decide Dynamically", description: "Let AI assess each situation" },
];

const EMOTIONAL_OPTIONS: { value: EmotionalPostHandling; label: string; description: string }[] = [
  { value: "never", label: "Never Engage", description: "Skip all emotional content" },
  { value: "observe", label: "Observe Only", description: "Watch but don't interact" },
  { value: "neutral_only", label: "Neutral Tone Only", description: "Respond without matching emotion" },
];

const WORSE_OUTCOME_OPTIONS: { value: WorseOutcome; label: string; description: string }[] = [
  { value: "post_off", label: "Posting Something Off", description: "I'd rather miss opportunities than risk embarrassment" },
  { value: "miss_opportunity", label: "Missing Opportunities", description: "I'd rather engage more even if occasionally off" },
];

interface WizardState {
  // Step 1
  voiceStyles: VoiceStyle[];
  primaryIntent: PrimaryIntent;
  aiInitiationComfort: AIInitiationComfort;
  // Step 2
  neverEngageTopics: NeverEngageTopic[];
  debatePreference: DebatePreference;
  blockedAccounts: string[];
  blockedAccountInput: string;
  // Step 3
  replyFrequency: ReplyFrequency;
  activeHoursType: ActiveHoursType;
  priorityPostTypes: PriorityPostType[];
  // Step 4
  uncertaintyAction: UncertaintyAction;
  emotionalPostHandling: EmotionalPostHandling;
  worseOutcome: WorseOutcome;
}

const CONSERVATIVE_DEFAULTS: Omit<WizardState, "blockedAccountInput"> = {
  voiceStyles: [],
  primaryIntent: "stay_present",
  aiInitiationComfort: "only_safe",
  neverEngageTopics: ["politics", "religion", "sexual_content", "mental_health", "personal_relationships", "controversial_social", "legal_medical", "drama"],
  debatePreference: "avoid",
  blockedAccounts: [],
  replyFrequency: "very_limited",
  activeHoursType: "my_daytime",
  priorityPostTypes: [],
  uncertaintyAction: "do_nothing",
  emotionalPostHandling: "never",
  worseOutcome: "post_off",
};

export function OnboardingPreferencesWizard({ open, onComplete }: OnboardingPreferencesWizardProps) {
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<WizardState>({
    ...CONSERVATIVE_DEFAULTS,
    blockedAccountInput: "",
  });

  const steps = [
    {
      id: "voice",
      title: "Your Voice & Intent",
      description: "Help us understand how you communicate publicly.",
      icon: <Mic2 className="h-12 w-12 text-primary" />,
      gradient: "from-primary/20 via-primary/10 to-transparent",
      microcopy: "The AI will learn your voice from your posts. This helps it understand your baseline.",
    },
    {
      id: "guardrails",
      title: "Hard Guardrails",
      description: "Topics and situations the AI should never touch.",
      icon: <Shield className="h-12 w-12 text-red-500" />,
      gradient: "from-red-500/20 via-red-500/10 to-transparent",
      microcopy: "Conservative defaults protect your reputation. You can always loosen these later.",
    },
    {
      id: "boundaries",
      title: "Engagement Boundaries",
      description: "Control how often and when the AI engages.",
      icon: <Activity className="h-12 w-12 text-blue-500" />,
      gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
      microcopy: "Silence is a valid outcome. The AI will back off if limits are reached.",
    },
    {
      id: "risk",
      title: "Risk & Restraint",
      description: "Calibrate how the AI handles uncertainty.",
      icon: <Scale className="h-12 w-12 text-amber-500" />,
      gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
      microcopy: "When unsure, the system backs off. You're training an assistant terrified of embarrassing you.",
    },
  ];

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    // Skip saves conservative defaults
    setState({
      ...CONSERVATIVE_DEFAULTS,
      blockedAccountInput: "",
    });
    await handleComplete(true);
  };

  const handleComplete = async (useDefaults = false) => {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token");

      const prefsToSave = useDefaults ? CONSERVATIVE_DEFAULTS : state;

      await updatePreferences({
        voice_styles: prefsToSave.voiceStyles.length > 0 ? prefsToSave.voiceStyles : null,
        primary_intent: prefsToSave.primaryIntent,
        ai_initiation_comfort: prefsToSave.aiInitiationComfort,
        never_engage_topics: prefsToSave.neverEngageTopics.length > 0 ? prefsToSave.neverEngageTopics : null,
        debate_preference: prefsToSave.debatePreference,
        blocked_accounts: prefsToSave.blockedAccounts.length > 0 ? prefsToSave.blockedAccounts : null,
        reply_frequency: prefsToSave.replyFrequency,
        active_hours_type: prefsToSave.activeHoursType,
        priority_post_types: prefsToSave.priorityPostTypes.length > 0 ? prefsToSave.priorityPostTypes : null,
        uncertainty_action: prefsToSave.uncertaintyAction,
        emotional_post_handling: prefsToSave.emotionalPostHandling,
        worse_outcome: prefsToSave.worseOutcome,
        preferences_onboarding_completed: true,
        preferences_onboarding_completed_at: new Date().toISOString(),
      }, token);

      onComplete();
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBlockedAccount = () => {
    const handle = state.blockedAccountInput.trim().replace(/^@/, "");
    if (handle && !state.blockedAccounts.includes(handle)) {
      setState((prev) => ({
        ...prev,
        blockedAccounts: [...prev.blockedAccounts, handle],
        blockedAccountInput: "",
      }));
    }
  };

  const removeBlockedAccount = (handle: string) => {
    setState((prev) => ({
      ...prev,
      blockedAccounts: prev.blockedAccounts.filter((h) => h !== handle),
    }));
  };

  const toggleVoiceStyle = (value: VoiceStyle) => {
    setState((prev) => ({
      ...prev,
      voiceStyles: prev.voiceStyles.includes(value)
        ? prev.voiceStyles.filter((v) => v !== value)
        : [...prev.voiceStyles, value],
    }));
  };

  const toggleNeverEngageTopic = (value: NeverEngageTopic) => {
    setState((prev) => ({
      ...prev,
      neverEngageTopics: prev.neverEngageTopics.includes(value)
        ? prev.neverEngageTopics.filter((v) => v !== value)
        : [...prev.neverEngageTopics, value],
    }));
  };

  const togglePriorityPostType = (value: PriorityPostType) => {
    setState((prev) => ({
      ...prev,
      priorityPostTypes: prev.priorityPostTypes.includes(value)
        ? prev.priorityPostTypes.filter((v) => v !== value)
        : [...prev.priorityPostTypes, value],
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            {/* Voice styles - multi-select */}
            <div className="space-y-3">
              <Label className="text-base font-medium">How would you describe your public voice?</Label>
              <p className="text-sm text-muted-foreground">Select all that apply</p>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_STYLES.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleVoiceStyle(option.value)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      state.voiceStyles.includes(option.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 rounded border flex items-center justify-center",
                      state.voiceStyles.includes(option.value)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.voiceStyles.includes(option.value) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary intent - single select */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Primary reason for using Parallel Universe?</Label>
              <div className="space-y-2">
                {PRIMARY_INTENTS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, primaryIntent: option.value }))}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.primaryIntent === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center",
                      state.primaryIntent === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.primaryIntent === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI initiation comfort - single select */}
            <div className="space-y-3">
              <Label className="text-base font-medium">How comfortable are you with AI initiating replies?</Label>
              <div className="space-y-2">
                {AI_INITIATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, aiInitiationComfort: option.value }))}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.aiInitiationComfort === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center",
                      state.aiInitiationComfort === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.aiInitiationComfort === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            {/* Warning banner */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm text-red-500">Hard Guardrails</p>
                <p className="text-xs text-muted-foreground">
                  Selected topics will NEVER be engaged with. By default, all sensitive topics are blocked.
                </p>
              </div>
            </div>

            {/* Never engage topics - multi-select (checked = blocked) */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Topics the AI should NEVER engage with</Label>
              <p className="text-sm text-muted-foreground">Uncheck only topics you're comfortable with</p>
              <div className="grid grid-cols-2 gap-2">
                {NEVER_ENGAGE_TOPICS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleNeverEngageTopic(option.value)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      state.neverEngageTopics.includes(option.value)
                        ? "border-red-500/50 bg-red-500/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 rounded border flex items-center justify-center",
                      state.neverEngageTopics.includes(option.value)
                        ? "bg-red-500 border-red-500"
                        : "border-muted-foreground/50"
                    )}>
                      {state.neverEngageTopics.includes(option.value) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Debate preference */}
            <div className="space-y-3">
              <Label className="text-base font-medium">How should AI handle disagreements?</Label>
              <div className="grid grid-cols-2 gap-2">
                {DEBATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, debatePreference: option.value }))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.debatePreference === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      state.debatePreference === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.debatePreference === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Blocked accounts */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Accounts to never reply to</Label>
              <p className="text-sm text-muted-foreground">Add @handles the AI should completely ignore</p>
              <div className="flex gap-2">
                <Input
                  placeholder="@username"
                  value={state.blockedAccountInput}
                  onChange={(e) => setState((prev) => ({ ...prev, blockedAccountInput: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addBlockedAccount()}
                  className="flex-1"
                />
                <Button onClick={addBlockedAccount} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {state.blockedAccounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {state.blockedAccounts.map((handle) => (
                    <span
                      key={handle}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-sm"
                    >
                      @{handle}
                      <button
                        onClick={() => removeBlockedAccount(handle)}
                        className="hover:text-red-500 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Reply frequency */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Maximum reply frequency?</Label>
              <div className="grid grid-cols-2 gap-2">
                {REPLY_FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, replyFrequency: option.value }))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.replyFrequency === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      state.replyFrequency === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.replyFrequency === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active hours */}
            <div className="space-y-3">
              <Label className="text-base font-medium">When should the AI be active?</Label>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVE_HOURS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, activeHoursType: option.value }))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.activeHoursType === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      state.activeHoursType === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.activeHoursType === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority post types */}
            <div className="space-y-3">
              <Label className="text-base font-medium">What types of posts should be prioritized?</Label>
              <p className="text-sm text-muted-foreground">Select all that apply (leave empty for all relevant)</p>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_POST_TYPES.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => togglePriorityPostType(option.value)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      state.priorityPostTypes.includes(option.value)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 rounded border flex items-center justify-center",
                      state.priorityPostTypes.includes(option.value)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.priorityPostTypes.includes(option.value) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Info className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm text-amber-500">Risk Calibration</p>
                <p className="text-xs text-muted-foreground">
                  This determines how the AI handles uncertainty. Conservative settings mean more silence but fewer mistakes.
                </p>
              </div>
            </div>

            {/* Uncertainty action */}
            <div className="space-y-3">
              <Label className="text-base font-medium">If the AI is uncertain, what should it do?</Label>
              <div className="space-y-2">
                {UNCERTAINTY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, uncertaintyAction: option.value }))}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.uncertaintyAction === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      state.uncertaintyAction === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.uncertaintyAction === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emotional post handling */}
            <div className="space-y-3">
              <Label className="text-base font-medium">How should AI handle emotional posts?</Label>
              <div className="space-y-2">
                {EMOTIONAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, emotionalPostHandling: option.value }))}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.emotionalPostHandling === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      state.emotionalPostHandling === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.emotionalPostHandling === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Worse outcome */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Which outcome is worse for you?</Label>
              <p className="text-sm text-muted-foreground">This calibrates the entire system's risk tolerance</p>
              <div className="space-y-2">
                {WORSE_OUTCOME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, worseOutcome: option.value }))}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      state.worseOutcome === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      state.worseOutcome === option.value
                        ? "border-primary"
                        : "border-muted-foreground/50"
                    )}>
                      {state.worseOutcome === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden gap-0 max-h-[90vh]"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Gradient header with icon */}
        <div
          className={cn(
            "h-32 flex items-center justify-center bg-gradient-to-b shrink-0",
            step.gradient
          )}
        >
          <div className="p-4 rounded-full bg-background/80 backdrop-blur-sm shadow-lg">
            {step.icon}
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
          <div>
            <h2 className="text-xl font-bold">{step.title}</h2>
            <p className="text-muted-foreground">{step.description}</p>
          </div>

          {/* Microcopy */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground italic">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{step.microcopy}</span>
          </div>

          {renderStepContent()}
        </div>

        {/* Footer with progress and buttons */}
        <div className="p-4 border-t flex items-center justify-between bg-muted/30 shrink-0">
          {/* Progress dots */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-6 bg-primary"
                    : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
              Skip (Use Defaults)
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving..."
              ) : isLastStep ? (
                "Complete Setup"
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
