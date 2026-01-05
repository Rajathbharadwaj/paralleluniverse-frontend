"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  MessageCircle,
  Repeat2,
  TrendingUp,
  FileText,
  RefreshCw,
  BarChart3,
  ExternalLink,
  Bot,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  fetchAnalyticsSummary,
  fetchEngagementTimeline,
  fetchTopPosts,
  fetchAgentActivity,
  fetchAutomationPerformance,
  fetchCommentsMadeSummary,
  fetchTopCommentsMade,
  AnalyticsSummary,
  EngagementDataPoint,
  TopPost,
  AgentActivity,
  AutomationPerformance,
  CommentsMadeSummary,
  CommentMade,
} from "@/lib/api/analytics";

export default function AnalyticsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeline, setTimeline] = useState<EngagementDataPoint[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [agentActivity, setAgentActivity] = useState<AgentActivity | null>(null);
  const [automationPerformance, setAutomationPerformance] = useState<AutomationPerformance | null>(null);
  const [commentsSummary, setCommentsSummary] = useState<CommentsMadeSummary | null>(null);
  const [topComments, setTopComments] = useState<CommentMade[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      const token = await getToken();
      if (!token) return;

      const [summaryData, timelineData, postsData, activityData, automationData, commentsSummaryData, topCommentsData] = await Promise.all([
        fetchAnalyticsSummary(token, period),
        fetchEngagementTimeline(token, period),
        fetchTopPosts(token, 10),
        fetchAgentActivity(token, period),
        fetchAutomationPerformance(token, period),
        fetchCommentsMadeSummary(token, period),
        fetchTopCommentsMade(token, 10, period),
      ]);

      setSummary(summaryData);
      setTimeline(timelineData.data);
      setTopPosts(postsData.posts);
      setAgentActivity(activityData);
      setAutomationPerformance(automationData);
      setCommentsSummary(commentsSummaryData);
      setTopComments(topCommentsData.comments);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, getToken, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const CHART_COLORS = {
    likes: "#3B82F6",
    retweets: "#10B981",
    replies: "#8B5CF6",
  };

  const ACTIVITY_COLORS: Record<string, string> = {
    post: "#3B82F6",
    like: "#EF4444",
    comment: "#10B981",
    web_search: "#F59E0B",
    unlike: "#6B7280",
  };

  // Transform agent activity data for pie chart
  const activityPieData = agentActivity?.by_type
    ? Object.entries(agentActivity.by_type).map(([name, value]) => ({
        name: name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
        color: ACTIVITY_COLORS[name] || "#888888",
      }))
    : [];

  // Transform automation data for bar chart
  const automationBarData = automationPerformance?.runs_by_day?.map((d) => ({
    date: d.date,
    completed: d.completed,
    failed: d.total - d.completed,
  })) || [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Track your X growth and engagement metrics
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {summary?.total_engagement.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Engagement
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {summary?.total_posts.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Posts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {summary?.engagement_rate || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Avg Engagement/Post
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Repeat2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {summary?.total_retweets.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Retweets
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="h-4 w-4" />
              Top Posts
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-2">
              <Bot className="h-4 w-4" />
              Agent Activity
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-2">
              <Clock className="h-4 w-4" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Over Time</CardTitle>
                <CardDescription>
                  Track likes, retweets, and replies across your posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : timeline.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No engagement data available</p>
                      <p className="text-sm">Import your posts to see analytics</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={timeline}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          name.charAt(0).toUpperCase() + name.slice(1),
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="likes"
                        stroke={CHART_COLORS.likes}
                        strokeWidth={2}
                        dot={false}
                        name="Likes"
                      />
                      <Line
                        type="monotone"
                        dataKey="retweets"
                        stroke={CHART_COLORS.retweets}
                        strokeWidth={2}
                        dot={false}
                        name="Retweets"
                      />
                      <Line
                        type="monotone"
                        dataKey="replies"
                        stroke={CHART_COLORS.replies}
                        strokeWidth={2}
                        dot={false}
                        name="Replies"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Likes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {summary?.total_likes.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total likes in {period === "all" ? "all time" : `last ${period.replace("d", " days")}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Repeat2 className="h-5 w-5 text-green-500" />
                    Retweets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {summary?.total_retweets.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total retweets in {period === "all" ? "all time" : `last ${period.replace("d", " days")}`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                    Replies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {summary?.total_replies.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total replies in {period === "all" ? "all time" : `last ${period.replace("d", " days")}`}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
                <CardDescription>
                  Your highest engagement posts sorted by total engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : topPosts.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No posts found</p>
                    <p className="text-sm">Import your posts to see top performers</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead className="text-right">Likes</TableHead>
                        <TableHead className="text-right">Retweets</TableHead>
                        <TableHead className="text-right">Replies</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPosts.map((post, index) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            {index < 3 ? (
                              <Badge
                                variant={
                                  index === 0
                                    ? "default"
                                    : index === 1
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                #{index + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                #{index + 1}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="truncate" title={post.content || ""}>
                              {post.content}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {post.likes.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {post.retweets.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {post.replies.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {post.engagement_score.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {post.posted_at
                              ? new Date(post.posted_at).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {post.post_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  window.open(post.post_url!, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Activity Tab */}
          <TabsContent value="agent">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Breakdown Pie Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Activity Breakdown</CardTitle>
                      <CardDescription>
                        Distribution of agent actions by type
                      </CardDescription>
                    </div>
                    {agentActivity && (
                      <Badge
                        variant={agentActivity.success_rate > 90 ? "default" : "secondary"}
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {agentActivity.success_rate}% Success
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : activityPieData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No agent activity recorded</p>
                        <p className="text-sm">Run automations to see activity data</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={activityPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {activityPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Activity Stats Cards */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Zap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {agentActivity?.total_actions.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Actions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {agentActivity?.successful_actions.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Successful Actions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {((agentActivity?.total_actions || 0) - (agentActivity?.successful_actions || 0)).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Failed Actions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity by Type Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Actions by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {agentActivity?.by_type && Object.entries(agentActivity.by_type).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: ACTIVITY_COLORS[type] || "#888888" }}
                            />
                            <span className="capitalize">{type.replace("_", " ")}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {automationPerformance?.total_runs.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Runs
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {automationPerformance?.completed_runs.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {automationPerformance?.failed_runs.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Failed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {automationPerformance?.success_rate || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Success Rate
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Automation Runs Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Automation Runs Over Time</CardTitle>
                      <CardDescription>
                        Daily breakdown of completed and failed automation runs
                      </CardDescription>
                    </div>
                    {automationPerformance && (
                      <div className="text-sm text-muted-foreground">
                        Avg. duration: {Math.round(automationPerformance.avg_duration_seconds)}s
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : automationBarData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No automation runs recorded</p>
                        <p className="text-sm">Schedule automations to see performance data</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={automationBarData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) =>
                            new Date(d).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Legend />
                        <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                        <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <div className="space-y-6">
              {/* Comments Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <MessageCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {commentsSummary?.total_comments.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Comments Made
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                        <Heart className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {commentsSummary?.total_likes.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Likes on Comments
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {commentsSummary?.avg_likes.toFixed(1) || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Avg Likes/Comment
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Zap className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {commentsSummary?.engagement_rate.toFixed(1) || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Engagement Rate
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Comments Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Comments</CardTitle>
                  <CardDescription>
                    Comments made by the agent sorted by engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : topComments.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No comments found</p>
                      <p className="text-sm">The agent hasn&apos;t made any comments yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead className="text-right">Likes</TableHead>
                          <TableHead className="text-right">Replies</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topComments.map((comment, index) => (
                          <TableRow key={comment.id}>
                            <TableCell>
                              {index < 3 ? (
                                <Badge
                                  variant={
                                    index === 0
                                      ? "default"
                                      : index === 1
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  #{index + 1}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">
                                  #{index + 1}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <p className="truncate" title={comment.content || ""}>
                                {comment.content}
                              </p>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {comment.target_author ? `@${comment.target_author}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {comment.likes.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {comment.replies.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {comment.commented_at
                                ? new Date(comment.commented_at).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {comment.comment_url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    window.open(comment.comment_url!, "_blank")
                                  }
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </DashboardLayout>
  );
}
