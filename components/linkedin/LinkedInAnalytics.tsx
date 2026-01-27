"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  TrendingUp,
  MessageSquare,
  FileText,
  Heart,
  Linkedin,
  BarChart3,
} from "lucide-react";
import { fetchLinkedInAnalytics, LinkedInAnalytics as LinkedInAnalyticsType } from "@/lib/api/linkedin";

interface LinkedInAnalyticsProps {
  isConnected: boolean;
}

export function LinkedInAnalytics({ isConnected }: LinkedInAnalyticsProps) {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState<LinkedInAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isConnected) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const token = await getToken();
        if (token) {
          const data = await fetchLinkedInAnalytics(token, parseInt(timeRange));
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to load LinkedIn analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [isConnected, timeRange, getToken]);

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Connect LinkedIn to view analytics
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Track your professional engagement and growth
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
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "7" | "30" | "90")}>
          <TabsList>
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
            <TabsTrigger value="90">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_posts || 0}</div>
            <p className="text-xs text-muted-foreground">
              in the last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_comments || 0}</div>
            <p className="text-xs text-muted-foreground">
              professional engagements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reactions Received</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_reactions_received || 0}</div>
            <p className="text-xs text-muted-foreground">
              on your posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Reactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.avg_reactions_per_post?.toFixed(1) || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              per post
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Posts Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts Activity
            </CardTitle>
            <CardDescription>Your posting frequency over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.posts_by_day && analytics.posts_by_day.length > 0 ? (
              <div className="space-y-2">
                {analytics.posts_by_day.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0A66C2] h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (day.count / 5) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8">{day.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No posts yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments Activity
            </CardTitle>
            <CardDescription>Your engagement frequency over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.comments_by_day && analytics.comments_by_day.length > 0 ? (
              <div className="space-y-2">
                {analytics.comments_by_day.slice(-7).map((day) => (
                  <div key={day.date} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0A66C2] h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (day.count / 10) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8">{day.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-[#0A66C2]/10 to-[#004182]/10 border-[#0A66C2]/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-[#0A66C2]" />
            LinkedIn Growth Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-[#0A66C2] font-bold">1.</span>
              <span>Post during peak hours: 8-10 AM, 12-1 PM, and 5-6 PM</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0A66C2] font-bold">2.</span>
              <span>Engage on Tuesday-Thursday for highest visibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0A66C2] font-bold">3.</span>
              <span>Comments with 50+ characters get more visibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0A66C2] font-bold">4.</span>
              <span>Add genuine value: insights, questions, or experiences</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
