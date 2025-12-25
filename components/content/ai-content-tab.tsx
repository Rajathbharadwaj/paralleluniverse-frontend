"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ImagePlus,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";
import { PostCard } from "./post-card";
import { generateAIContent, createScheduledPost, fetchAIDrafts, deleteScheduledPost, updateScheduledPost, uploadMedia, generateAIImage } from "@/lib/api/scheduled-posts";

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

  // Edit modal state
  const [editingPost, setEditingPost] = useState<AIPost | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMediaUrls, setEditMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAIImage, setIsGeneratingAIImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load AI drafts on mount
  useEffect(() => {
    const loadDrafts = async () => {
      if (!userId) return;

      try {
        console.log("📥 Loading AI drafts from database...");
        const token = await getToken();
        if (!token) {
          console.error("❌ No auth token available");
          return;
        }
        const drafts = await fetchAIDrafts(userId, token);
        console.log(`✅ Loaded ${drafts.length} AI drafts`);

        // Transform to AIPost format
        const transformedPosts: AIPost[] = drafts.map((draft: any) => {
          const scheduledDate = new Date(draft.scheduled_at);
          // Convert media_urls array to media objects
          const mediaObjects = (draft.media_urls || []).map((url: string) => ({
            type: "image",
            url
          }));
          return {
            id: draft.id,
            content: draft.content,
            scheduled_at: draft.scheduled_at,
            confidence: draft.confidence,
            media: mediaObjects,
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

  // Generate more AI content
  const generateMoreContent = async () => {
    console.log("🚀 Starting AI content generation...");

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

  // Open edit modal
  const openEditModal = (post: AIPost) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditMediaUrls(post.media?.map((m: any) => m.url) || []);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingPost(null);
    setEditContent("");
    setEditMediaUrls([]);
  };

  // Handle media file upload
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required");
        return;
      }

      for (const file of Array.from(files)) {
        console.log(`📤 Uploading ${file.name}...`);
        const url = await uploadMedia(file, token);
        if (url) {
          setEditMediaUrls(prev => [...prev, url]);
          console.log(`✅ Uploaded: ${url}`);
        }
      }
    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove media from edit
  const removeMedia = (index: number) => {
    setEditMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Save edited post
  const saveEdit = async () => {
    if (!editingPost || !userId) return;

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required");
        return;
      }

      console.log(`💾 Saving post ${editingPost.id}...`);
      await updateScheduledPost(editingPost.id, userId, {
        content: editContent,
        media_urls: editMediaUrls
      }, token);

      // Update local state
      setAIPosts(prev => prev.map(p =>
        p.id === editingPost.id
          ? { ...p, content: editContent, media: editMediaUrls.map(url => ({ type: "image", url })) }
          : p
      ));

      console.log("✅ Post saved");
      closeEditModal();
    } catch (error) {
      console.error("❌ Save failed:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate AI image for the post
  const handleGenerateAIImage = async () => {
    if (!editContent.trim()) {
      alert("Please enter some post content first to generate a relevant image.");
      return;
    }

    if (editMediaUrls.length >= 4) {
      alert("Maximum 4 images allowed. Remove an existing image first.");
      return;
    }

    setIsGeneratingAIImage(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required");
        return;
      }

      console.log("🎨 Generating AI image for post...");
      const result = await generateAIImage(editContent, token, "1:1");

      if (result.success && result.image_url) {
        setEditMediaUrls(prev => [...prev, result.image_url!]);
        console.log("✅ AI image generated:", result.image_url);
      } else {
        throw new Error(result.error || "Failed to generate image");
      }
    } catch (error) {
      console.error("❌ AI image generation failed:", error);
      alert(`Failed to generate AI image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingAIImage(false);
    }
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

      {/* Edit Modal - Does not close on outside click, only via Cancel/Save */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent
          className="max-w-2xl"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Post
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Content Editor */}
            <div className="space-y-2">
              <Label htmlFor="content">Post Content</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[150px] resize-none"
                maxLength={280}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Character count</span>
                <span className={editContent.length > 280 ? "text-red-500" : ""}>
                  {editContent.length}/280
                </span>
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <Label>Media Attachments</Label>

              {/* Uploaded Media Preview */}
              {editMediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {editMediaUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isGeneratingAIImage || editMediaUrls.length >= 4}
                  className="gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Add Media
                    </>
                  )}
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAIImage}
                        disabled={isUploading || isGeneratingAIImage || editMediaUrls.length >= 4 || !editContent.trim()}
                        className="gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-purple-300"
                      >
                        {isGeneratingAIImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 text-purple-600" />
                            Generate AI Image
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-900 text-white">
                      <p className="text-xs">Costs 27 credits</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-xs text-muted-foreground">
                  {editMediaUrls.length}/4 images (max)
                </span>
              </div>
            </div>

            {/* Scheduled Time Display */}
            {editingPost && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Calendar className="h-4 w-4" />
                <span>
                  Scheduled for:{" "}
                  {editingPost.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}{" "}
                  at {editingPost.time}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEditModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isSaving || editContent.length === 0}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
