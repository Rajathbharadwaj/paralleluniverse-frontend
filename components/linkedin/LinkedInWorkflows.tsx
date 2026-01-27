"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Play,
  MessageSquare,
  Users,
  FileText,
  UserPlus,
  Linkedin,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  fetchLinkedInWorkflows,
  runLinkedInWorkflow,
  fetchLinkedInDailyLimits,
  LinkedInWorkflow,
  LinkedInDailyLimits,
} from "@/lib/api/linkedin";

interface LinkedInWorkflowsProps {
  isConnected: boolean;
}

const WORKFLOW_ICONS: Record<string, React.ReactNode> = {
  linkedin_engagement: <MessageSquare className="h-5 w-5" />,
  linkedin_profile_engagement: <Users className="h-5 w-5" />,
  linkedin_content_posting: <FileText className="h-5 w-5" />,
  linkedin_connection_outreach: <UserPlus className="h-5 w-5" />,
};

const WORKFLOW_COLORS: Record<string, string> = {
  linkedin_engagement: "from-blue-500 to-cyan-500",
  linkedin_profile_engagement: "from-purple-500 to-pink-500",
  linkedin_content_posting: "from-green-500 to-emerald-500",
  linkedin_connection_outreach: "from-orange-500 to-amber-500",
};

export function LinkedInWorkflows({ isConnected }: LinkedInWorkflowsProps) {
  const { getToken } = useAuth();
  const [workflows, setWorkflows] = useState<LinkedInWorkflow[]>([]);
  const [limits, setLimits] = useState<LinkedInDailyLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        if (token) {
          const [workflowsData, limitsData] = await Promise.all([
            fetchLinkedInWorkflows(token),
            fetchLinkedInDailyLimits(token),
          ]);
          setWorkflows(workflowsData);
          setLimits(limitsData);
        }
      } catch (error) {
        console.error("Failed to load LinkedIn data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, getToken]);

  const handleRunWorkflow = async (workflowId: string) => {
    setRunningWorkflow(workflowId);
    try {
      const token = await getToken();
      if (token) {
        const result = await runLinkedInWorkflow(workflowId, {}, token);
        if (result.success) {
          // Refresh limits after running workflow
          const newLimits = await fetchLinkedInDailyLimits(token);
          setLimits(newLimits);
        }
      }
    } catch (error) {
      console.error("Failed to run workflow:", error);
    } finally {
      setRunningWorkflow(null);
    }
  };

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Linkedin className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Connect LinkedIn to access workflows
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Automate your professional engagement with AI-powered workflows
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Limits Card */}
      {limits && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Limits
            </CardTitle>
            <CardDescription>Your remaining actions for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-[#0A66C2]">
                  {limits.remaining.reactions_remaining}
                </p>
                <p className="text-xs text-muted-foreground">Reactions</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-[#0A66C2]">
                  {limits.remaining.comments_remaining}
                </p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-[#0A66C2]">
                  {limits.remaining.connection_requests_remaining}
                </p>
                <p className="text-xs text-muted-foreground">Connections</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-[#0A66C2]">
                  {limits.remaining.posts_remaining}
                </p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="overflow-hidden">
            <div
              className={`h-1 bg-gradient-to-r ${
                WORKFLOW_COLORS[workflow.id] || "from-gray-500 to-gray-600"
              }`}
            />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${
                      WORKFLOW_COLORS[workflow.id] || "from-gray-500 to-gray-600"
                    } text-white`}
                  >
                    {WORKFLOW_ICONS[workflow.id] || <Linkedin className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{workflow.name}</CardTitle>
                    {workflow.version && (
                      <Badge variant="outline" className="text-xs mt-1">
                        v{workflow.version}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{workflow.description}</p>

              {workflow.daily_limits && (
                <div className="flex flex-wrap gap-2">
                  {workflow.daily_limits.reactions && (
                    <Badge variant="secondary" className="text-xs">
                      {workflow.daily_limits.reactions} reactions/day
                    </Badge>
                  )}
                  {workflow.daily_limits.comments && (
                    <Badge variant="secondary" className="text-xs">
                      {workflow.daily_limits.comments} comments/day
                    </Badge>
                  )}
                  {workflow.daily_limits.connection_requests && (
                    <Badge variant="secondary" className="text-xs">
                      {workflow.daily_limits.connection_requests} connections/day
                    </Badge>
                  )}
                </div>
              )}

              <Button
                className="w-full bg-[#0A66C2] hover:bg-[#004182]"
                onClick={() => handleRunWorkflow(workflow.id)}
                disabled={runningWorkflow !== null}
              >
                {runningWorkflow === workflow.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Workflow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No workflows available</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Workflows will appear here once configured
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
