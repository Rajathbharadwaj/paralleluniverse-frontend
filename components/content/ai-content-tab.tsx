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
  Clock
} from "lucide-react";
import { PostCard } from "./post-card";
import { generateAIContent, createScheduledPost, fetchAIDrafts, deleteScheduledPost, updateScheduledPost } from "@/lib/api/scheduled-posts";

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
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load AI drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      if (!userId) return;

      try {
        console.log("📥 Loading AI drafts from database...");
        const drafts = await fetchAIDrafts(userId);
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
  }, [userId]);

  // Generate more AI content
  const generateMoreContent = async () => {
    if (!userId) {
      alert("User ID is required");
      return;
    }

    console.log("🚀 Starting AI content generation for user:", userId);

    try {
      setIsGenerating(true);
      console.log("⏳ Calling generateAIContent API...");

      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        setIsGenerating(false);
        return;
      }

      // Call AI generation API (generate 7 posts for the week)
      const generatedPosts = await generateAIContent(userId, token, 7);

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
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
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
    </div>
  );
}
