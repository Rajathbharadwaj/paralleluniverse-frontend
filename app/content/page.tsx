"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard-header";
import { CalendarGrid } from "@/components/content/calendar-grid";
import { AIContentTab } from "@/components/content/ai-content-tab";
import { PostComposer } from "@/components/content/post-composer";
import { Plus, Calendar, Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { fetchScheduledPosts, type ScheduledPost } from "@/lib/api/scheduled-posts";

export default function ContentCalendarPage() {
  const { user } = useUser();
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Get next 7 days
  const getNext7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const next7Days = getNext7Days();

  // Fetch scheduled posts from backend
  useEffect(() => {
    if (!user) return;

    const loadPosts = async () => {
      try {
        setLoading(true);
        const startDate = next7Days[0];
        const endDate = new Date(next7Days[6]);
        endDate.setHours(23, 59, 59, 999);

        const fetchedPosts = await fetchScheduledPosts(user.id, startDate, endDate);
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [user]);

  // Refresh posts after creating/updating
  const refreshPosts = async () => {
    if (!user) return;
    try {
      const startDate = next7Days[0];
      const endDate = new Date(next7Days[6]);
      endDate.setHours(23, 59, 59, 999);

      const fetchedPosts = await fetchScheduledPosts(user.id, startDate, endDate);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Failed to refresh posts:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <DashboardHeader />

      {/* Page Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                Content Calendar
              </h1>
              <p className="text-muted-foreground mt-1">
                Schedule and manage your X posts for the next 7 days
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => setComposerOpen(true)}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Post
            </Button>
          </div>

          {/* Date Range */}
          <div className="text-sm text-muted-foreground">
            {next7Days[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            {' '}-{' '}
            {next7Days[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="scheduled" className="gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Posts
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard
                label="Scheduled"
                value={posts.filter(p => p.status === "scheduled").length}
                color="bg-blue-500"
              />
              <StatsCard
                label="Drafts"
                value={posts.filter(p => p.status === "draft").length}
                color="bg-yellow-500"
              />
              <StatsCard
                label="Posted"
                value={posts.filter(p => p.status === "posted").length}
                color="bg-green-500"
              />
              <StatsCard
                label="Failed"
                value={posts.filter(p => p.status === "failed").length}
                color="bg-red-500"
              />
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : (
              <CalendarGrid
                days={next7Days}
                posts={posts}
                onCreatePost={(date, time) => {
                  setComposerOpen(true);
                }}
                onRefresh={refreshPosts}
              />
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIContentTab days={next7Days} userId={user?.id} onRefresh={refreshPosts} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Composer Modal */}
      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        userId={user?.id}
        onSuccess={refreshPosts}
      />
    </div>
  );
}

function StatsCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
