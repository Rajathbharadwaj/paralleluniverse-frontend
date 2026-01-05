"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Github,
  Slack,
  FileText,
  Layers,
  Figma,
  Plus,
  Check,
  X,
  Loader2,
  Activity,
  FileEdit,
  Clock,
  Trash2,
  Pause,
  Play,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useWorkIntegrations,
  useConnectIntegration,
  useDeleteIntegration,
  usePauseIntegration,
  useResumeIntegration,
  useActivityDrafts,
  useApproveDraft,
  useRejectDraft,
  useTriggerDigest,
  useWorkIntegrationsOverview,
  useWorkActivities,
  type WorkPlatform,
  type WorkIntegration,
  type ActivityDraft,
  type WorkActivity,
} from "@/hooks/useWorkIntegrations";

// Platform configuration
const PLATFORMS: {
  id: WorkPlatform;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}[] = [
  {
    id: "github",
    name: "GitHub",
    icon: <Github className="h-6 w-6" />,
    description: "Track commits, PRs, releases, and issues",
    color: "bg-gray-900 text-white",
  },
  {
    id: "slack",
    name: "Slack",
    icon: <Slack className="h-6 w-6" />,
    description: "Monitor channel activity and messages",
    color: "bg-purple-600 text-white",
  },
  {
    id: "notion",
    name: "Notion",
    icon: <FileText className="h-6 w-6" />,
    description: "Track page updates and database changes",
    color: "bg-gray-800 text-white",
  },
  {
    id: "linear",
    name: "Linear",
    icon: <Layers className="h-6 w-6" />,
    description: "Track issues, cycles, and project updates",
    color: "bg-indigo-600 text-white",
  },
  {
    id: "figma",
    name: "Figma",
    icon: <Figma className="h-6 w-6" />,
    description: "Track design comments and version history",
    color: "bg-pink-600 text-white",
  },
];

function getPlatformConfig(platform: WorkPlatform) {
  return PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0];
}

// Integration Card Component
function IntegrationCard({
  integration,
  onDisconnect,
  onPause,
  onResume,
}: {
  integration: WorkIntegration;
  onDisconnect: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const config = getPlatformConfig(integration.platform);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.color}`}>{config.icon}</div>
              <div>
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <CardDescription>
                  {integration.external_account_name || "Connected"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.is_active ? (
                <Badge variant="default" className="bg-green-500">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Paused</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection status */}
          {integration.connection_error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{integration.connection_error}</AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last activity:</span>
              <p className="font-medium">
                {integration.last_activity_at
                  ? new Date(integration.last_activity_at).toLocaleDateString()
                  : "No activity yet"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Webhook:</span>
              <p className="font-medium">
                {integration.webhook_registered ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Active
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Not set up
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* GitHub repos */}
          {integration.platform === "github" && integration.github_repos.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Tracking repos:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {integration.github_repos.map((repo) => (
                  <Badge key={repo} variant="outline" className="text-xs">
                    {repo}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={integration.is_active ? onPause : onResume}
            >
              {integration.is_active ? (
                <>
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" /> Resume
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowConfirmDisconnect(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Disconnect Dialog */}
      <Dialog open={showConfirmDisconnect} onOpenChange={setShowConfirmDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {config.name}?</DialogTitle>
            <DialogDescription>
              This will remove the integration and stop tracking activity. You can
              reconnect at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDisconnect(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDisconnect();
                setShowConfirmDisconnect(false);
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Draft Card Component
function DraftCard({
  draft,
  onApprove,
  onReject,
}: {
  draft: ActivityDraft;
  onApprove: (content?: string) => void;
  onReject: (reason?: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(draft.content);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="mb-2">
                {draft.digest_theme || "Daily Update"}
              </Badge>
              <CardDescription>
                {new Date(draft.digest_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </div>
            <Badge
              variant={
                draft.status === "pending"
                  ? "default"
                  : draft.status === "approved" || draft.status === "edited"
                  ? "secondary"
                  : "destructive"
              }
            >
              {draft.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px]"
              maxLength={280}
            />
          ) : (
            <div className="bg-muted p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{draft.content}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{draft.content.length}/280 characters</span>
            {draft.expires_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Expires {new Date(draft.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {draft.status === "pending" && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      onApprove(editedContent !== draft.content ? editedContent : undefined);
                      setIsEditing(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" /> Save & Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedContent(draft.content);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => onApprove()}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <FileEdit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </>
              )}
            </div>
          )}

          {draft.scheduled_at && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Scheduled for {new Date(draft.scheduled_at).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Draft</DialogTitle>
            <DialogDescription>
              Optionally provide feedback to help improve future drafts.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Why wasn't this draft suitable? (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onReject(rejectReason || undefined);
                setShowRejectDialog(false);
                setRejectReason("");
              }}
            >
              Reject Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Activity Card Component
function ActivityCard({ activity }: { activity: WorkActivity }) {
  const config = getPlatformConfig(activity.platform);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "code_shipped":
        return "bg-green-100 text-green-800 border-green-200";
      case "progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "collaboration":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes("merged") || type.includes("release")) return "🚀";
    if (type.includes("opened") || type.includes("created")) return "✨";
    if (type.includes("closed") || type.includes("completed")) return "✅";
    if (type.includes("comment")) return "💬";
    if (type.includes("commit") || type.includes("push")) return "📝";
    if (type.includes("review")) return "👀";
    return "📌";
  };

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
          <span className="font-medium truncate">{activity.title}</span>
        </div>
        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {activity.description}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={getCategoryColor(activity.category)}>
            {activity.category.replace("_", " ")}
          </Badge>
          {activity.repo_or_project && (
            <Badge variant="outline" className="text-xs">
              {activity.repo_or_project}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(activity.activity_at).toLocaleString()}
          </span>
          {activity.url && (
            <a
              href={activity.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {/* Metrics */}
        {(activity.lines_added > 0 || activity.files_changed > 0) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {activity.lines_added > 0 && (
              <span className="text-green-600">+{activity.lines_added} lines</span>
            )}
            {activity.lines_removed > 0 && (
              <span className="text-red-600">-{activity.lines_removed} lines</span>
            )}
            {activity.files_changed > 0 && (
              <span>{activity.files_changed} files</span>
            )}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-medium text-muted-foreground">
          Score: {activity.significance_score.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

// Inner component with search params
function IntegrationsPageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("integrations");
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  // Data hooks
  const { data: integrationsData, mutate: mutateIntegrations } = useWorkIntegrations();
  const { data: draftsData, mutate: mutateDrafts } = useActivityDrafts("pending");
  const { data: overview } = useWorkIntegrationsOverview();
  const { data: activitiesData, mutate: mutateActivities } = useWorkActivities({
    page_size: 20,
  });

  // Mutation hooks
  const { trigger: connectIntegration, isMutating: isConnecting } = useConnectIntegration();
  const { trigger: deleteIntegration } = useDeleteIntegration();
  const { trigger: pauseIntegration } = usePauseIntegration();
  const { trigger: resumeIntegration } = useResumeIntegration();
  const { trigger: approveDraft } = useApproveDraft();
  const { trigger: rejectDraft } = useRejectDraft();
  const { trigger: triggerDigest, isMutating: isTriggering } = useTriggerDigest();

  // Handle OAuth callback success
  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected) {
      setShowSuccess(`Successfully connected ${connected}!`);
      mutateIntegrations();
      setTimeout(() => setShowSuccess(null), 5000);
    }
  }, [searchParams, mutateIntegrations]);

  const connectedPlatforms = new Set(
    integrationsData?.integrations.map((i) => i.platform) || []
  );

  const handleConnect = async (platform: WorkPlatform) => {
    try {
      await connectIntegration({ platform });
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = async (integrationId: number) => {
    try {
      await deleteIntegration({ integrationId });
      mutateIntegrations();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handlePause = async (integrationId: number) => {
    try {
      await pauseIntegration({ integrationId });
      mutateIntegrations();
    } catch (error) {
      console.error("Failed to pause:", error);
    }
  };

  const handleResume = async (integrationId: number) => {
    try {
      await resumeIntegration({ integrationId });
      mutateIntegrations();
    } catch (error) {
      console.error("Failed to resume:", error);
    }
  };

  const handleApproveDraft = async (draftId: number, editedContent?: string) => {
    try {
      await approveDraft({ draftId, editedContent });
      mutateDrafts();
    } catch (error) {
      console.error("Failed to approve:", error);
    }
  };

  const handleRejectDraft = async (draftId: number, reason?: string) => {
    try {
      await rejectDraft({ draftId, reason });
      mutateDrafts();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const handleTriggerDigest = async () => {
    try {
      const result = await triggerDigest();
      if (result.success) {
        setShowSuccess(`Generated ${result.drafts?.length || 0} draft(s)!`);
        mutateDrafts();
        setTimeout(() => setShowSuccess(null), 5000);
      }
    } catch (error) {
      console.error("Failed to trigger digest:", error);
    }
  };

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Success Alert */}
        {showSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{showSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Work Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect your tools to automatically generate "build in public" posts
            </p>
          </div>
          {integrationsData?.integrations && integrationsData.integrations.length > 0 && (
            <Button onClick={handleTriggerDigest} disabled={isTriggering}>
              {isTriggering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate Draft Now
            </Button>
          )}
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{overview.total_integrations}</div>
                <p className="text-sm text-muted-foreground">Connected Platforms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{overview.total_activities_captured}</div>
                <p className="text-sm text-muted-foreground">Activities Captured</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {overview.pending_drafts}
                </div>
                <p className="text-sm text-muted-foreground">Pending Drafts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {overview.drafts_approved_this_month}
                </div>
                <p className="text-sm text-muted-foreground">Approved This Month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Activity Feed
              {activitiesData?.total ? (
                <Badge variant="outline" className="ml-1">
                  {activitiesData.total}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Pending Drafts
              {draftsData?.pending_count ? (
                <Badge variant="secondary" className="ml-1">
                  {draftsData.pending_count}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            {/* Connected Integrations */}
            {integrationsData?.integrations && integrationsData.integrations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Connected</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {integrationsData.integrations.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onDisconnect={() => handleDisconnect(integration.id)}
                      onPause={() => handlePause(integration.id)}
                      onResume={() => handleResume(integration.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available Platforms */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {integrationsData?.integrations?.length ? "Add More" : "Available Platforms"}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLATFORMS.filter((p) => !connectedPlatforms.has(p.id)).map((platform) => (
                  <Card
                    key={platform.id}
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleConnect(platform.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${platform.color}`}>
                          {platform.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{platform.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {platform.description}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" disabled={isConnecting}>
                          {isConnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="activity" className="space-y-6">
            {activitiesData?.activities && activitiesData.activities.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Recent Activity</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutateActivities()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-2">
                  {activitiesData.activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
                {activitiesData.total > activitiesData.activities.length && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {activitiesData.activities.length} of {activitiesData.total} activities
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Activities will appear here as they're captured from your connected platforms.
                  </p>
                  {!integrationsData?.integrations?.length && (
                    <Button onClick={() => setActiveTab("integrations")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect a Platform
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="space-y-6">
            {draftsData?.drafts && draftsData.drafts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {draftsData.drafts.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    onApprove={(content) => handleApproveDraft(draft.id, content)}
                    onReject={(reason) => handleRejectDraft(draft.id, reason)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Drafts</h3>
                  <p className="text-muted-foreground mb-4">
                    Drafts are generated daily at 9 PM UTC based on your work activity.
                  </p>
                  {integrationsData?.integrations?.length ? (
                    <Button onClick={handleTriggerDigest} disabled={isTriggering}>
                      {isTriggering ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Generate Draft Now
                    </Button>
                  ) : (
                    <Button onClick={() => setActiveTab("integrations")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect a Platform
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}

// Loading fallback
function IntegrationsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );
}

// Main Page Component with Suspense boundary
export default function IntegrationsPage() {
  return (
    <Suspense fallback={<IntegrationsLoading />}>
      <IntegrationsPageContent />
    </Suspense>
  );
}
