"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, MessageSquare, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

// Mock data - in production this comes from your backend
const mockActivity = [
  {
    id: "1",
    type: "like",
    status: "completed",
    target: "Post by @elonmusk",
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    type: "follow",
    status: "completed",
    target: "@sama",
    timestamp: "5 minutes ago",
  },
  {
    id: "3",
    type: "comment",
    status: "processing",
    target: "Post by @naval",
    timestamp: "Just now",
  },
  {
    id: "4",
    type: "like",
    status: "failed",
    target: "Post by @pmarca",
    timestamp: "10 minutes ago",
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart className="h-4 w-4" />;
    case "follow":
      return <UserPlus className="h-4 w-4" />;
    case "comment":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
};

export function RecentActivity() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="border rounded-lg bg-card shadow-sm">
      {/* Header - Always visible */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Recent Activity</h3>
            <Badge variant="secondary" className="text-xs">
              {mockActivity.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
          >
            {isCollapsed ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content - Collapsible */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="space-y-2">
            {mockActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    {getIcon(activity.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize text-xs">{activity.type}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.target}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.timestamp}</span>
                  {getStatusBadge(activity.status)}
                </div>
              </div>
            ))}
          </div>

          {mockActivity.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start automating to see activity
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

