"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  usePreferences,
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
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Settings,
  Zap,
  Bot,
  Shield,
  Loader2,
  CheckCircle,
  Info,
  CreditCard,
  Download,
  BookOpen,
  ExternalLink,
  Mic2,
  Activity,
  Scale,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Voice style options
const VOICE_STYLES: { value: VoiceStyle; label: string }[] = [
  { value: "analytical", label: "Analytical" },
  { value: "curious", label: "Curious" },
  { value: "opinionated", label: "Opinionated" },
  { value: "educational", label: "Educational" },
  { value: "casual", label: "Casual" },
  { value: "minimal", label: "Minimal" },
];

// Never engage topic options
const NEVER_ENGAGE_TOPICS: { value: NeverEngageTopic; label: string }[] = [
  { value: "politics", label: "Politics" },
  { value: "religion", label: "Religion" },
  { value: "sexual_content", label: "Sexual Content" },
  { value: "mental_health", label: "Mental Health" },
  { value: "personal_relationships", label: "Personal Relationships" },
  { value: "controversial_social", label: "Controversial Social Issues" },
  { value: "legal_medical", label: "Legal/Medical Advice" },
  { value: "drama", label: "Drama & Beef" },
];

// Priority post type options
const PRIORITY_POST_TYPES: { value: PriorityPostType; label: string }[] = [
  { value: "technical", label: "Technical Discussions" },
  { value: "threads_im_in", label: "Threads I'm In" },
  { value: "following", label: "People I Follow" },
  { value: "expertise", label: "My Expertise Areas" },
  { value: "high_signal", label: "High-Signal Posts" },
];

// Conservative defaults for reset
const CONSERVATIVE_DEFAULTS = {
  voice_styles: null,
  primary_intent: "stay_present" as PrimaryIntent,
  ai_initiation_comfort: "only_safe" as AIInitiationComfort,
  never_engage_topics: null, // null means ALL blocked
  debate_preference: "avoid" as DebatePreference,
  blocked_accounts: null,
  reply_frequency: "very_limited" as ReplyFrequency,
  active_hours_type: "my_daytime" as ActiveHoursType,
  priority_post_types: null,
  uncertainty_action: "do_nothing" as UncertaintyAction,
  emotional_post_handling: "never" as EmotionalPostHandling,
  worse_outcome: "post_off" as WorseOutcome,
};

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { data, error, mutate, isLoading } = usePreferences();
  const preferences = data?.preferences;

  // Legacy settings
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [aggressionLevel, setAggressionLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  // New preference settings
  const [voiceStyles, setVoiceStyles] = useState<VoiceStyle[]>([]);
  const [primaryIntent, setPrimaryIntent] = useState<PrimaryIntent>("stay_present");
  const [aiInitiationComfort, setAiInitiationComfort] = useState<AIInitiationComfort>("only_safe");
  const [neverEngageTopics, setNeverEngageTopics] = useState<NeverEngageTopic[]>([]);
  const [debatePreference, setDebatePreference] = useState<DebatePreference>("avoid");
  const [blockedAccounts, setBlockedAccounts] = useState<string[]>([]);
  const [blockedAccountInput, setBlockedAccountInput] = useState("");
  const [replyFrequency, setReplyFrequency] = useState<ReplyFrequency>("very_limited");
  const [activeHoursType, setActiveHoursType] = useState<ActiveHoursType>("my_daytime");
  const [priorityPostTypes, setPriorityPostTypes] = useState<PriorityPostType[]>([]);
  const [uncertaintyAction, setUncertaintyAction] = useState<UncertaintyAction>("do_nothing");
  const [emotionalPostHandling, setEmotionalPostHandling] = useState<EmotionalPostHandling>("never");
  const [worseOutcome, setWorseOutcome] = useState<WorseOutcome>("post_off");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Sync local state with fetched data
  useEffect(() => {
    if (preferences) {
      // Legacy settings
      setAutoPostEnabled(preferences.auto_post_enabled);
      setAggressionLevel(preferences.aggression_level);

      // New preference settings
      setVoiceStyles(preferences.voice_styles || []);
      setPrimaryIntent(preferences.primary_intent || "stay_present");
      setAiInitiationComfort(preferences.ai_initiation_comfort || "only_safe");
      // If never_engage_topics is null, default to ALL topics blocked
      setNeverEngageTopics(
        preferences.never_engage_topics ||
        ["politics", "religion", "sexual_content", "mental_health", "personal_relationships", "controversial_social", "legal_medical", "drama"]
      );
      setDebatePreference(preferences.debate_preference || "avoid");
      setBlockedAccounts(preferences.blocked_accounts || []);
      setReplyFrequency(preferences.reply_frequency || "very_limited");
      setActiveHoursType(preferences.active_hours_type || "my_daytime");
      setPriorityPostTypes(preferences.priority_post_types || []);
      setUncertaintyAction(preferences.uncertainty_action || "do_nothing");
      setEmotionalPostHandling(preferences.emotional_post_handling || "never");
      setWorseOutcome(preferences.worse_outcome || "post_off");
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await updatePreferences(
        {
          auto_post_enabled: autoPostEnabled,
          aggression_level: aggressionLevel,
          voice_styles: voiceStyles.length > 0 ? voiceStyles : null,
          primary_intent: primaryIntent,
          ai_initiation_comfort: aiInitiationComfort,
          never_engage_topics: neverEngageTopics.length > 0 ? neverEngageTopics : null,
          debate_preference: debatePreference,
          blocked_accounts: blockedAccounts.length > 0 ? blockedAccounts : null,
          reply_frequency: replyFrequency,
          active_hours_type: activeHoursType,
          priority_post_types: priorityPostTypes.length > 0 ? priorityPostTypes : null,
          uncertainty_action: uncertaintyAction,
          emotional_post_handling: emotionalPostHandling,
          worse_outcome: worseOutcome,
        },
        token
      );

      await mutate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm("Reset all preferences to conservative defaults? This cannot be undone.")) return;

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await updatePreferences(CONSERVATIVE_DEFAULTS, token);
      await mutate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to reset preferences:", err);
      alert("Failed to reset preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addBlockedAccount = () => {
    const handle = blockedAccountInput.trim().replace(/^@/, "").toLowerCase();
    if (handle && !blockedAccounts.includes(handle)) {
      setBlockedAccounts([...blockedAccounts, handle]);
      setBlockedAccountInput("");
    }
  };

  const removeBlockedAccount = (handle: string) => {
    setBlockedAccounts(blockedAccounts.filter((h) => h !== handle));
  };

  const toggleVoiceStyle = (value: VoiceStyle) => {
    setVoiceStyles((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleNeverEngageTopic = (value: NeverEngageTopic) => {
    setNeverEngageTopics((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const togglePriorityPostType = (value: PriorityPostType) => {
    setPriorityPostTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const getAggressionDescription = (level: string) => {
    switch (level) {
      case "conservative":
        return "50 likes, 20 comments, 5 posts per day. Safe for new accounts.";
      case "moderate":
        return "100 likes, 50 comments, 10 posts per day. Balanced growth.";
      case "aggressive":
        return "150 likes, 100 comments, 15 posts per day. Maximum growth.";
      default:
        return "";
    }
  };

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Configure your agent behavior and preferences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Saved!</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save All Changes"
              )}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load preferences. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Link href="/settings/billing">
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Billing</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Manage subscription & payments
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <a
            href="https://storage.googleapis.com/parallel-universe-prod-public/x-automation-extension.zip"
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Extension</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Download Chrome extension
                </CardDescription>
              </CardHeader>
            </Card>
          </a>

          <a
            href="https://parallel-universe-docs-644185288504.us-central1.run.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Documentation</CardTitle>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
                <CardDescription className="text-sm">
                  Guides, tutorials & API docs
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        </div>

        {preferences && (
          <div className="space-y-6">
            {/* ====== VOICE & TONE SECTION ====== */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mic2 className="h-5 w-5 text-primary" />
                  <CardTitle>Voice & Tone</CardTitle>
                </div>
                <CardDescription>
                  Define how the AI represents you in public
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Voice Styles */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Voice Styles</Label>
                  <p className="text-xs text-muted-foreground">Select all that describe your public voice</p>
                  <div className="flex flex-wrap gap-2">
                    {VOICE_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => toggleVoiceStyle(style.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm border transition-colors",
                          voiceStyles.includes(style.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {voiceStyles.includes(style.value) && <Check className="h-3 w-3 inline mr-1" />}
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Intent */}
                <div className="space-y-2">
                  <Label htmlFor="primary-intent">Primary Intent</Label>
                  <Select value={primaryIntent} onValueChange={(v) => setPrimaryIntent(v as PrimaryIntent)}>
                    <SelectTrigger id="primary-intent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stay_present">Stay Present - Maintain visibility</SelectItem>
                      <SelectItem value="keep_up">Keep Up - Stay on top of conversations</SelectItem>
                      <SelectItem value="avoid_missing">Avoid Missing - Don't miss discussions</SelectItem>
                      <SelectItem value="reduce_load">Reduce Load - Handle routine engagement</SelectItem>
                      <SelectItem value="experiment">Experiment - See what AI can do</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* AI Initiation Comfort */}
                <div className="space-y-2">
                  <Label htmlFor="ai-initiation">AI Initiation Comfort</Label>
                  <Select value={aiInitiationComfort} onValueChange={(v) => setAiInitiationComfort(v as AIInitiationComfort)}>
                    <SelectTrigger id="ai-initiation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="only_safe">Only Safe - Extremely conservative</SelectItem>
                      <SelectItem value="conservative">Conservative - Thoughtful, cautious</SelectItem>
                      <SelectItem value="balanced">Balanced - Mix of caution and initiative</SelectItem>
                      <SelectItem value="later">Decide Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* ====== HARD GUARDRAILS SECTION ====== */}
            <Card className="border-red-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-red-600 dark:text-red-400">Hard Guardrails</CardTitle>
                </div>
                <CardDescription>
                  Topics and accounts the AI will NEVER engage with
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Never Engage Topics */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Topics to Never Engage With</Label>
                  <p className="text-xs text-muted-foreground">Checked topics are BLOCKED. Uncheck only topics you're comfortable with.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {NEVER_ENGAGE_TOPICS.map((topic) => (
                      <button
                        key={topic.value}
                        onClick={() => toggleNeverEngageTopic(topic.value)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors",
                          neverEngageTopics.includes(topic.value)
                            ? "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                          neverEngageTopics.includes(topic.value)
                            ? "bg-red-500 border-red-500"
                            : "border-muted-foreground/50"
                        )}>
                          {neverEngageTopics.includes(topic.value) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Debate Preference */}
                <div className="space-y-2">
                  <Label htmlFor="debate-pref">Debate Preference</Label>
                  <Select value={debatePreference} onValueChange={(v) => setDebatePreference(v as DebatePreference)}>
                    <SelectTrigger id="debate-pref">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avoid">Avoid All - Never disagree or debate</SelectItem>
                      <SelectItem value="light">Light Only - Gentle corrections</SelectItem>
                      <SelectItem value="balanced">Balanced - Respectful disagreement OK</SelectItem>
                      <SelectItem value="case_by_case">Case by Case - AI decides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Blocked Accounts */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Blocked Accounts</Label>
                  <p className="text-xs text-muted-foreground">AI will never reply to these accounts</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="@username"
                      value={blockedAccountInput}
                      onChange={(e) => setBlockedAccountInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addBlockedAccount()}
                      className="flex-1"
                    />
                    <Button onClick={addBlockedAccount} variant="outline" size="sm">
                      Add
                    </Button>
                  </div>
                  {blockedAccounts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blockedAccounts.map((handle) => (
                        <span
                          key={handle}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 text-sm"
                        >
                          @{handle}
                          <button
                            onClick={() => removeBlockedAccount(handle)}
                            className="hover:text-red-500 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ====== ENGAGEMENT BOUNDARIES SECTION ====== */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <CardTitle>Engagement Boundaries</CardTitle>
                </div>
                <CardDescription>
                  Control frequency and timing of AI engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reply Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="reply-freq">Reply Frequency</Label>
                  <Select value={replyFrequency} onValueChange={(v) => setReplyFrequency(v as ReplyFrequency)}>
                    <SelectTrigger id="reply-freq">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_limited">Very Limited - Max 1-3 replies/day</SelectItem>
                      <SelectItem value="conservative">Conservative - 3-5 replies/day</SelectItem>
                      <SelectItem value="moderate">Moderate - Up to 10 replies/day</SelectItem>
                      <SelectItem value="later">Tune Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Hours */}
                <div className="space-y-2">
                  <Label htmlFor="active-hours">Active Hours</Label>
                  <Select value={activeHoursType} onValueChange={(v) => setActiveHoursType(v as ActiveHoursType)}>
                    <SelectTrigger id="active-hours">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="my_daytime">My Daytime - 9am-6pm in my timezone</SelectItem>
                      <SelectItem value="specific">Specific Hours - Configure manually</SelectItem>
                      <SelectItem value="always_observe">Always Observe - 24/7 but act conservatively</SelectItem>
                      <SelectItem value="later">Configure Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Post Types */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Priority Post Types</Label>
                  <p className="text-xs text-muted-foreground">AI will prioritize these types of posts (leave empty for all)</p>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITY_POST_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => togglePriorityPostType(type.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm border transition-colors",
                          priorityPostTypes.includes(type.value)
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-background border-border hover:border-blue-500/50"
                        )}
                      >
                        {priorityPostTypes.includes(type.value) && <Check className="h-3 w-3 inline mr-1" />}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ====== RISK & RESTRAINT SECTION ====== */}
            <Card className="border-amber-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-amber-500" />
                  <CardTitle>Risk & Restraint</CardTitle>
                </div>
                <CardDescription>
                  Calibrate how the AI handles uncertainty
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Uncertainty Action */}
                <div className="space-y-2">
                  <Label htmlFor="uncertainty">When Uncertain...</Label>
                  <Select value={uncertaintyAction} onValueChange={(v) => setUncertaintyAction(v as UncertaintyAction)}>
                    <SelectTrigger id="uncertainty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="do_nothing">Do Nothing - Skip if any doubt (safest)</SelectItem>
                      <SelectItem value="save_review">Save for Review - Queue for approval</SelectItem>
                      <SelectItem value="reply_cautious">Reply Cautiously - Proceed with extra care</SelectItem>
                      <SelectItem value="dynamic">Decide Dynamically - AI assesses each case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Emotional Post Handling */}
                <div className="space-y-2">
                  <Label htmlFor="emotional">Emotional Posts</Label>
                  <Select value={emotionalPostHandling} onValueChange={(v) => setEmotionalPostHandling(v as EmotionalPostHandling)}>
                    <SelectTrigger id="emotional">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never Engage - Skip all emotional content</SelectItem>
                      <SelectItem value="observe">Observe Only - Watch but don't interact</SelectItem>
                      <SelectItem value="neutral_only">Neutral Only - Respond without matching emotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Worse Outcome */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Which outcome is worse?</Label>
                  <p className="text-xs text-muted-foreground">This calibrates the entire system's risk tolerance</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      onClick={() => setWorseOutcome("post_off")}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        worseOutcome === "post_off"
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border hover:border-amber-500/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center",
                          worseOutcome === "post_off" ? "border-amber-500" : "border-muted-foreground/50"
                        )}>
                          {worseOutcome === "post_off" && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                        </div>
                        <span className="font-medium text-sm">Posting Something Off</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        I'd rather miss opportunities than risk embarrassment
                      </p>
                    </button>
                    <button
                      onClick={() => setWorseOutcome("miss_opportunity")}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        worseOutcome === "miss_opportunity"
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border hover:border-amber-500/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center",
                          worseOutcome === "miss_opportunity" ? "border-amber-500" : "border-muted-foreground/50"
                        )}>
                          {worseOutcome === "miss_opportunity" && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                        </div>
                        <span className="font-medium text-sm">Missing Opportunities</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        I'd rather engage more even if occasionally off
                      </p>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ====== LEGACY SETTINGS ====== */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle>Agent Behavior</CardTitle>
                </div>
                <CardDescription>
                  Legacy automation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto-Post */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-post" className="text-base">
                      Enable Auto-Posting
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {autoPostEnabled
                        ? "Content will be posted automatically"
                        : "Content will be queued for your review"}
                    </p>
                  </div>
                  <Switch
                    id="auto-post"
                    checked={autoPostEnabled}
                    onCheckedChange={setAutoPostEnabled}
                  />
                </div>

                {/* Aggression Level */}
                <div className="space-y-2">
                  <Label htmlFor="aggression">Engagement Level</Label>
                  <Select
                    value={aggressionLevel}
                    onValueChange={(value) =>
                      setAggressionLevel(value as "conservative" | "moderate" | "aggressive")
                    }
                  >
                    <SelectTrigger id="aggression">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          Conservative
                        </div>
                      </SelectItem>
                      <SelectItem value="moderate">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Moderate
                        </div>
                      </SelectItem>
                      <SelectItem value="aggressive">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-red-500" />
                          Aggressive
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {getAggressionDescription(aggressionLevel)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ====== ACTIONS ====== */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button variant="outline" onClick={handleResetToDefaults} disabled={isSaving}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Conservative Defaults
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
