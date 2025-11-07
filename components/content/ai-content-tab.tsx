"use client";

import { useState } from "react";
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
  Loader2
} from "lucide-react";
import { PostCard } from "./post-card";
import { generateAIContent, createScheduledPost } from "@/lib/api/scheduled-posts";

interface AIPost {
  id: string;
  content: string;
  scheduled_at: string;
  confidence: number;
  media: any[];
  status: "draft" | "scheduled" | "posted" | "failed";
  date: Date;
  time: string;
  source: string;
}

interface AIContentTabProps {
  days: Date[];
  userId?: string;
  onRefresh?: () => void;
}

export function AIContentTab({ days, userId, onRefresh }: AIContentTabProps) {
  const [aiPosts, setAIPosts] = useState<AIPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  // Generate more AI content
  const generateMoreContent = async () => {
    if (!userId) {
      alert("User ID is required");
      return;
    }

    try {
      setIsGenerating(true);

      // Call AI generation API
      const generatedPosts = await generateAIContent(userId, 5);

      // Transform API response to AIPost format
      const newPosts: AIPost[] = generatedPosts.map((post, index) => {
        const scheduledDate = new Date(post.scheduled_at);
        return {
          id: `ai-${Date.now()}-${index}`,
          content: post.content,
          scheduled_at: post.scheduled_at,
          confidence: post.confidence,
          media: [],
          status: "draft" as const,
          date: scheduledDate,
          time: scheduledDate.toTimeString().substring(0, 5),
          source: "ai"
        };
      });

      setAIPosts(prev => [...prev, ...newPosts]);
    } catch (error) {
      console.error("Failed to generate AI content:", error);
      alert("Failed to generate AI content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve post (add to scheduled)
  const approvePost = async (postId: string) => {
    if (!userId) {
      alert("User ID is required");
      return;
    }

    const post = aiPosts.find(p => p.id === postId);
    if (!post) return;

    try {
      // Create scheduled post in database
      await createScheduledPost({
        user_id: userId,
        content: post.content,
        media_urls: [],
        scheduled_at: post.scheduled_at,
        status: "scheduled",
      });

      // Remove from AI posts list
      setAIPosts(prev => prev.filter(p => p.id !== postId));

      // Refresh the main calendar
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to approve post:", error);
      alert("Failed to approve post. Please try again.");
    }
  };

  // Reject post
  const rejectPost = (postId: string) => {
    setAIPosts(prev => prev.filter(p => p.id !== postId));
  };

  // Toggle post selection
  const togglePostSelection = (postId: string) => {
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
                  <p className="text-sm mb-4 line-clamp-4">{post.content}</p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span>{post.time}</span>
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
