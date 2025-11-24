"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, FileText, ThumbsUp, ThumbsDown, Clock, CheckCircle2, XCircle, Search, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface ActivityItem {
  id: string;
  timestamp: string;
  action_type: "post" | "comment" | "like" | "unlike" | "web_search";
  status: "success" | "failed" | "processing";
  target?: string;
  details: {
    content?: string;
    post_url?: string;
    error?: string;
    query?: string;
    results_count?: number;
  };
}

const getIcon = (type: string) => {
  switch (type) {
    case "post":
      return <FileText className="h-4 w-4" />;
    case "comment":
      return <MessageSquare className="h-4 w-4" />;
    case "like":
      return <ThumbsUp className="h-4 w-4" />;
    case "unlike":
      return <ThumbsDown className="h-4 w-4" />;
    case "web_search":
      return <Search className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "success":
      return (
        <Badge variant="default" className="gap-1 text-[10px]">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Clock className="h-3 w-3" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1 text-[10px]">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
};

const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

export function RecentActivityLive() {
  const { user } = useUser();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState(0);

  // Fetch initial activities
  const fetchActivities = useCallback(async () => {
    if (!user?.id) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8002';
      const res = await fetch(`${backendUrl}/api/activity/recent/${user.id}?limit=20`);
      const data = await res.json();

      if (data.success && data.activities) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial data
    fetchActivities();

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        // Use production WebSocket URL or fallback to localhost
        const wsBaseUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8002';
        ws = new WebSocket(`${wsBaseUrl}/ws/activity/${user.id}`);

        ws.onopen = () => {
          console.log("📡 Connected to activity stream");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle activity updates
            if (data.type === "activity_complete") {
              // Add new activity to the top of the list
              const newActivity: ActivityItem = {
                id: data.id || `activity_${Date.now()}`,
                timestamp: data.timestamp || new Date().toISOString(),
                action_type: data.action,
                status: data.status,
                target: data.target,
                details: data.details || {}
              };

              setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep max 50
              setLiveUpdates(prev => prev + 1);

              // Auto-expand if collapsed
              setIsCollapsed(false);
            }
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        ws.onerror = () => {
          // WebSocket errors don't expose details for security
          // Just silently handle - onclose will trigger reconnect
        };

        ws.onclose = () => {
          console.log("📡 Disconnected from activity stream, reconnecting...");
          // Auto-reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        // Retry connection after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    // Cleanup
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on intentional close
        ws.close();
      }
    };
  }, [user?.id, fetchActivities]);

  if (isLoading) {
    return (
      <div className="border rounded-lg bg-card shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary animate-spin" />
          <h3 className="font-semibold text-sm">Loading Activity...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card shadow-sm">
      {/* Header - Always visible */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Recent Activity</h3>
            <Badge variant="secondary" className="text-xs">
              {activities.length}
            </Badge>
            {liveUpdates > 0 && (
              <Badge variant="default" className="text-xs animate-pulse">
                Live
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content - Collapsible */}
      {!isCollapsed && (
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    {getIcon(activity.action_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium capitalize text-xs">
                        {activity.action_type.replace("_", " ")}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>

                    {activity.target && (
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        Target: {activity.target}
                      </p>
                    )}

                    {activity.details.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.details.content}
                      </p>
                    )}

                    {activity.details.post_url && (
                      <a
                        href={activity.details.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View post →
                      </a>
                    )}

                    {activity.details.error && (
                      <p className="text-xs text-destructive mt-1">
                        Error: {activity.details.error}
                      </p>
                    )}

                    {activity.details.query && (
                      <p className="text-xs text-muted-foreground">
                        Query: {activity.details.query}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {getStatusBadge(activity.status)}
                </div>
              </div>
            ))}
          </div>

          {activities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start automating to see activity here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
