"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Calendar,
  Clock,
  AlertTriangle,
  Check,
  X,
  Trash2,
  Save,
} from "lucide-react";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: number;
    content: string;
    scheduled_at: string;
    confidence: number;
    metadata?: {
      posting_time_rationale?: string;
      topic?: string;
      content_type?: string;
      [key: string]: any;
    };
  } | null;
  onSave: (postId: number, content: string, scheduledAt: string) => Promise<void>;
  onDelete: (postId: number) => Promise<void>;
  onApprove: (postId: number) => Promise<void>;
}

const MAX_TWEET_LENGTH = 280;
const THREAD_WARNING_LENGTH = 280;

export function EditPostModal({
  isOpen,
  onClose,
  post,
  onSave,
  onDelete,
  onApprove,
}: EditPostModalProps) {
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize form when post changes
  useEffect(() => {
    if (post) {
      setContent(post.content);
      const date = new Date(post.scheduled_at);
      // Format date as YYYY-MM-DD for input[type="date"]
      setScheduledDate(date.toISOString().split("T")[0]);
      // Format time as HH:MM for input[type="time"]
      setScheduledTime(date.toTimeString().substring(0, 5));
    }
  }, [post]);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        // Move cursor to end
        textareaRef.current?.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }

      // Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, content, scheduledDate, scheduledTime]);

  const handleSave = async () => {
    if (!post) return;

    setIsSaving(true);
    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await onSave(post.id, content, scheduledAt);
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    setIsDeleting(true);
    try {
      await onDelete(post.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    if (!post) return;

    setIsApproving(true);
    try {
      // Save any changes first
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await onSave(post.id, content, scheduledAt);
      // Then approve
      await onApprove(post.id);
      onClose();
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_TWEET_LENGTH;
  const isNearLimit = charCount > MAX_TWEET_LENGTH - 20 && charCount <= MAX_TWEET_LENGTH;
  const isThread = charCount > THREAD_WARNING_LENGTH;

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Edit AI Draft
          </DialogTitle>
          <DialogDescription>
            Review and edit this AI-generated post before scheduling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <div className="flex items-center gap-2">
                {isThread && !isOverLimit && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Thread needed
                  </Badge>
                )}
                <span
                  className={`text-xs font-mono ${
                    isOverLimit
                      ? "text-red-600"
                      : isNearLimit
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {charCount}/{MAX_TWEET_LENGTH}
                </span>
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`min-h-[150px] resize-none ${
                isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
              placeholder="Write your post..."
            />
            {isOverLimit && (
              <p className="text-xs text-red-600">
                Content exceeds 280 characters. It will be posted as a thread.
              </p>
            )}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* AI Metadata */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Insights
            </h4>

            {/* Confidence Score */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="font-medium">{Math.round(post.confidence * 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  style={{ width: `${post.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* Posting Time Rationale */}
            {post.metadata?.posting_time_rationale && (
              <div className="text-xs">
                <span className="text-muted-foreground">Optimal Time Rationale:</span>
                <p className="mt-1 text-foreground bg-background rounded p-2 border">
                  {post.metadata.posting_time_rationale}
                </p>
              </div>
            )}

            {/* Topic/Type */}
            {(post.metadata?.topic || post.metadata?.content_type) && (
              <div className="flex items-center gap-2 text-xs">
                {post.metadata?.topic && (
                  <Badge variant="secondary">{post.metadata.topic}</Badge>
                )}
                {post.metadata?.content_type && (
                  <Badge variant="outline">{post.metadata.content_type}</Badge>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-background">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Your Name</span>
                    <span className="text-muted-foreground text-sm">@username</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{content}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Scheduled for{" "}
                    {scheduledDate && scheduledTime
                      ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()
                      : "..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting || isSaving || isApproving}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving || isApproving}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || isApproving || isDeleting}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSaving || isApproving || isDeleting}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {isApproving ? "Approving..." : "Save & Approve"}
            </Button>
          </div>
        </DialogFooter>

        {/* Keyboard shortcut hint */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Cmd+Enter</kbd> to save
        </p>
      </DialogContent>
    </Dialog>
  );
}
