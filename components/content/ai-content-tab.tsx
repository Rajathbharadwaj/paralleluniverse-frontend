"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Calendar,
  Check,
  X,
  Edit,
  RefreshCw,
  Loader2,
  Info,
  Clock,
  Download
} from "lucide-react";
import { PostCard } from "./post-card";
import { EditPostModal } from "./edit-post-modal";
import { generateAIContent, createScheduledPost, fetchAIDrafts, deleteScheduledPost, updateScheduledPost } from "@/lib/api/scheduled-posts";
import { fetchBackendAuth } from "@/lib/api-client";

interface AIPost {
  id: number;  // Database ID
  content: string;
  scheduled_at: string;
  confidence: number;
  media: any[];
  status: "draft" | "scheduled" | "posted" | "failed";
  date: Date;
  time: string;
  source: string;
  metadata?: {
    posting_time_rationale?: string;
    topic?: string;
    content_type?: string;
    [key: string]: any;
  };
}

interface AIContentTabProps {
  days: Date[];
  userId?: string;
  onRefresh?: () => void;
}

export function AIContentTab({ days, userId, onRefresh }: AIContentTabProps) {
  const { getToken } = useAuth();
  const [aiPosts, setAIPosts] = useState<AIPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<AIPost | null>(null);

  // Load AI drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      if (!userId) return;

      try {
        console.log("📥 Loading AI drafts from database...");

        const token = await getToken();
        if (!token) {
          console.warn("⚠️ No auth token available for loading AI drafts");
          setIsLoading(false);
          return;
        }

        const drafts = await fetchAIDrafts(userId, token);
        console.log(`✅ Loaded ${drafts.length} AI drafts`);

        // Transform to AIPost format
        const transformedPosts: AIPost[] = drafts.map((draft: any) => {
          const scheduledDate = new Date(draft.scheduled_at);
          return {
            id: draft.id,
            content: draft.content,
            scheduled_at: draft.scheduled_at,
            confidence: draft.confidence,
            media: [],
            status: "draft" as const,
            date: scheduledDate,
            time: scheduledDate.toTimeString().substring(0, 5),
            source: "ai",
            metadata: draft.metadata
          };
        });

        setAIPosts(transformedPosts);
      } catch (error) {
        console.error("❌ Failed to load AI drafts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDrafts();
  }, [userId, getToken]);

  // Sync posts from X before generating AI content
  const syncPostsFromX = async (token: string): Promise<{ imported: number; message: string }> => {
    console.log("🔄 Syncing posts from X...");
    setIsSyncing(true);
    setSyncStatus("Checking for new posts on X...");

    try {
      const response = await fetchBackendAuth('/api/scrape-posts-docker', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCount: 50,  // Check for up to 50 posts
          forceFullImport: false  // Don't force, let backend decide
        })
      });

      const result = await response.json();
      console.log("📥 Sync result:", result);

      if (result.success) {
        if (result.imported > 0) {
          setSyncStatus(`Imported ${result.imported} new posts for better AI learning`);
          return { imported: result.imported, message: `Imported ${result.imported} new posts` };
        } else {
          setSyncStatus("Your posts are up to date");
          return { imported: 0, message: result.message || "Already up to date" };
        }
      } else {
        // Don't block generation if sync fails
        console.warn("⚠️ Sync failed:", result.error);
        setSyncStatus(null);
        return { imported: 0, message: result.error || "Sync failed" };
      }
    } catch (error) {
      console.error("❌ Sync error:", error);
      setSyncStatus(null);
      return { imported: 0, message: "Failed to sync" };
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate more AI content
  const generateMoreContent = async () => {
    console.log("🚀 Starting AI content generation...");

    try {
      setIsGenerating(true);

      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        setIsGenerating(false);
        return;
      }

      // Step 1: Sync posts from X (incremental - only imports new posts)
      console.log("📡 Step 1: Syncing posts from X...");
      const syncResult = await syncPostsFromX(token);
      console.log("✅ Sync complete:", syncResult);

      // Brief pause to let user see sync status
      if (syncResult.imported > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Step 2: Generate AI content
      console.log("⏳ Step 2: Calling generateAIContent API...");
      setSyncStatus(null);

      // Call AI generation API (generate 7 posts for the week)
      // Backend will use authenticated user from JWT token
      const generatedPosts = await generateAIContent(token, 7);

      console.log("✅ Received response with", generatedPosts?.length || 0, "posts");
      console.log("Response data:", generatedPosts);

      if (!generatedPosts || generatedPosts.length === 0) {
        throw new Error("No posts were generated");
      }

      // Transform API response to AIPost format (now includes database IDs)
      const newPosts: AIPost[] = generatedPosts.map((post: any, index) => {
        console.log(`📝 Processing post ${index + 1}:`, {
          id: post.id,
          content: post.content?.substring(0, 50),
          scheduled_at: post.scheduled_at,
          confidence: post.confidence
        });

        const scheduledDate = new Date(post.scheduled_at);
        return {
          id: post.id,  // Use database ID from backend
          content: post.content,
          scheduled_at: post.scheduled_at,
          confidence: post.confidence,
          media: [],
          status: "draft" as const,
          date: scheduledDate,
          time: scheduledDate.toTimeString().substring(0, 5),
          source: "ai",
          metadata: post.metadata
        };
      });

      console.log("✅ Transformed", newPosts.length, "posts, updating state...");
      setAIPosts(prev => [...prev, ...newPosts]);
      console.log("✅ State updated successfully!");

    } catch (error) {
      console.error("❌ Failed to generate AI content:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Failed to generate AI content: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      console.log("🏁 Setting isGenerating to false");
      setIsGenerating(false);
    }
  };

  // Approve post (update status from draft to scheduled)
  const approvePost = async (postId: number) => {
    if (!userId) {
      alert("User ID is required");
      return;
    }

    const post = aiPosts.find(p => p.id === postId);
    if (!post) return;

    try {
      console.log(`✅ Approving post ${postId}, updating status to scheduled...`);

      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        return;
      }

      // Update the existing draft post's status to "scheduled"
      await updateScheduledPost(postId, userId, {
        status: "scheduled"
      }, token);

      console.log("✅ Post approved and status updated");

      // Remove from AI posts list
      setAIPosts(prev => prev.filter(p => p.id !== postId));

      // Refresh the main calendar
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("❌ Failed to approve post:", error);
      alert("Failed to approve post. Please try again.");
    }
  };

  // Reject post (delete from database)
  const rejectPost = async (postId: number) => {
    if (!userId) {
      alert("User ID is required");
      return;
    }

    try {
      console.log(`🗑️  Deleting post ${postId} from database...`);

      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        return;
      }

      await deleteScheduledPost(postId, userId, token);
      setAIPosts(prev => prev.filter(p => p.id !== postId));
      console.log("✅ Post deleted successfully");
    } catch (error) {
      console.error("❌ Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  // Toggle post selection
  const togglePostSelection = (postId: number) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Toggle post expansion
  const togglePostExpansion = (postId: number) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Approve all selected
  const approveAllSelected = async () => {
    const promises = Array.from(selectedPosts).map(postId => approvePost(postId));
    await Promise.all(promises);
    setSelectedPosts(new Set());
  };

  // Save edited post
  const savePost = async (postId: number, content: string, scheduledAt: string) => {
    if (!userId) {
      alert("User ID is required");
      return;
    }

    try {
      console.log(`💾 Saving post ${postId}...`);

      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        return;
      }

      await updateScheduledPost(postId, userId, {
        content,
        scheduled_at: scheduledAt
      }, token);

      console.log("✅ Post saved successfully");

      // Update local state
      setAIPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const scheduledDate = new Date(scheduledAt);
          return {
            ...p,
            content,
            scheduled_at: scheduledAt,
            date: scheduledDate,
            time: scheduledDate.toTimeString().substring(0, 5)
          };
        }
        return p;
      }));
    } catch (error) {
      console.error("❌ Failed to save post:", error);
      alert("Failed to save post. Please try again.");
      throw error;
    }
  };

  // Open edit modal
  const openEditModal = (post: AIPost) => {
    setEditingPost(post);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-200/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-bold">AI Content Generator</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-generated posts based on your writing style and topics.
              Review and approve posts to add them to your schedule.
            </p>
          </div>

          <Button
            onClick={generateMoreContent}
            disabled={isGenerating || isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <>
                <Download className="h-4 w-4 animate-bounce" />
                Syncing...
              </>
            ) : isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Generate More
              </>
            )}
          </Button>
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
            {isSyncing ? (
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-bounce" />
            ) : (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            <span className="text-blue-700 dark:text-blue-300">{syncStatus}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-background/50 rounded-lg p-3">
            <p className="text-2xl font-bold">{aiPosts.length}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <p className="text-2xl font-bold">{selectedPosts.size}</p>
            <p className="text-xs text-muted-foreground">Selected</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3">
            <p className="text-2xl font-bold">7</p>
            <p className="text-xs text-muted-foreground">Days Covered</p>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedPosts.size} post{selectedPosts.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPosts(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={approveAllSelected}
              >
                <Check className="h-4 w-4" />
                Approve All Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* AI Posts Grid */}
      {aiPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No AI Content Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate AI posts based on your writing style and topics
          </p>
          <Button onClick={generateMoreContent} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Content
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiPosts.map((post) => {
            const isSelected = selectedPosts.has(post.id);
            const isExpanded = expandedPosts.has(post.id);
            const contentLines = post.content.split('\n').length;
            const isLongContent = contentLines > 4 || post.content.length > 200;

            return (
              <Card
                key={post.id}
                className={`relative overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePostSelection(post.id)}
                    className="h-5 w-5 rounded border-2 cursor-pointer"
                  />
                </div>

                {/* AI Badge */}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="gap-1 bg-purple-500/20 text-purple-700 border-purple-300">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </Badge>
                </div>

                <div className="p-6 pt-12">
                  {/* Post Content */}
                  <div className="text-sm mb-2">
                    <p className={`whitespace-pre-wrap ${!isExpanded && isLongContent ? 'line-clamp-4' : ''}`}>
                      {post.content}
                    </p>
                    {isLongContent && (
                      <button
                        onClick={() => togglePostExpansion(post.id)}
                        className="text-primary hover:underline text-xs mt-1 font-medium"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span>•</span>
                      <span>{post.time}</span>
                    </div>

                    {/* Optimal Time Rationale */}
                    {post.metadata?.posting_time_rationale && (
                      <div className="flex items-start gap-2 text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                        <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-700 dark:text-blue-300 leading-tight">
                          {post.metadata.posting_time_rationale}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confidence Score */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">{Math.round(post.confidence * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        style={{ width: `${post.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => rejectPost(post.id)}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => openEditModal(post)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => approvePost(post.id)}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSave={savePost}
        onDelete={rejectPost}
        onApprove={approvePost}
      />
    </div>
  );
}
