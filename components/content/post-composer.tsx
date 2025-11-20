"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Image as ImageIcon,
  Video,
  X,
  Smile,
  Hash,
  Sparkles,
  Calendar,
  Clock,
  Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createScheduledPost, uploadMedia, updateScheduledPost, type ScheduledPost } from "@/lib/api/scheduled-posts";

interface PostComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onSuccess?: () => void;
  editPost?: ScheduledPost | null;
}

export function PostComposer({ open, onOpenChange, userId, onSuccess, editPost }: PostComposerProps) {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<Array<{ type: string; file: File; preview: string }>>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editPost) {
      setCaption(editPost.content);

      // Parse scheduled date and time
      if (editPost.scheduled_at) {
        const date = new Date(editPost.scheduled_at);
        setSelectedDate(date.toISOString().split('T')[0]);
        setSelectedTime(date.toTimeString().substring(0, 5));
      }
    } else {
      // Reset form when creating new post
      setCaption("");
      setMedia([]);
      setSelectedDate("");
      setSelectedTime("");
    }
  }, [editPost, open]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      // Check file type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        alert("Please upload only images or videos");
        return;
      }

      // Check if we already have 4 media items (X limit)
      if (media.length >= 4) {
        alert("Maximum 4 media files allowed");
        return;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      setMedia(prev => [
        ...prev,
        {
          type: isImage ? "image" : "video",
          file,
          preview
        }
      ]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove media
  const removeMedia = (index: number) => {
    setMedia(prev => {
      const newMedia = [...prev];
      // Revoke preview URL
      URL.revokeObjectURL(newMedia[index].preview);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  // Generate AI caption
  const generateCaption = async () => {
    setIsGeneratingCaption(true);

    // TODO: Call your AI API
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiCaptions = [
      "Just shipped something amazing! 🚀 Check it out and let me know what you think.",
      "Building in public has been the best decision I've made. Here's what I learned...",
      "Pro tip: Sometimes the simplest solution is the best solution. Don't overthink it.",
    ];

    const randomCaption = aiCaptions[Math.floor(Math.random() * aiCaptions.length)];
    setCaption(randomCaption);
    setIsGeneratingCaption(false);
  };

  // Handle post submission
  const handleSubmit = async (action: "draft" | "schedule") => {
    if (!userId && !editPost) {
      alert("User ID is required");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload media files and collect URLs
      const mediaUrls: string[] = [];
      for (const item of media) {
        const url = await uploadMedia(item.file);
        mediaUrls.push(url);
      }

      // Combine date and time into ISO datetime
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);

      if (editPost) {
        // Update existing post
        await updateScheduledPost(editPost.id, {
          content: caption,
          media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
          scheduled_at: scheduledDateTime.toISOString(),
          status: action === "draft" ? "draft" : "scheduled",
        });
      } else {
        // Create new post
        await createScheduledPost({
          user_id: userId!,
          content: caption,
          media_urls: mediaUrls,
          scheduled_at: scheduledDateTime.toISOString(),
          status: action === "draft" ? "draft" : "scheduled",
        });
      }

      // Reset and close
      setCaption("");
      setMedia([]);
      setSelectedDate("");
      setSelectedTime("");
      onOpenChange(false);

      // Refresh the calendar
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(`Failed to ${editPost ? 'update' : 'create'} post:`, error);
      alert(`Failed to ${editPost ? 'update' : 'create'} post. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = caption.length;
  const charLimit = 280;
  const charWarning = charCount > 250;
  const charError = charCount > charLimit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPost ? 'Edit Post' : 'Create Post'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Media Upload */}
          <div className="space-y-3">
            <Label>Media (Optional)</Label>

            {/* Upload Area */}
            {media.length < 4 && (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop images or videos here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse • Max 4 files • JPG, PNG, MP4
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Media Previews */}
            {media.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {media.map((item, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      {item.type === "image" ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                            {item.file.name}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                          <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                            {item.file.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Caption</Label>
              <span className={`text-xs ${charWarning ? 'text-orange-500' : ''} ${charError ? 'text-red-500' : 'text-muted-foreground'}`}>
                {charCount} / {charLimit}
              </span>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's happening?"
              className="w-full min-h-[120px] px-4 py-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              maxLength={charLimit}
            />

            {/* Caption Tools */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Smile className="h-4 w-4" />
                  Emoji
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Hash className="h-4 w-4" />
                  Hashtags
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={generateCaption}
                disabled={isGeneratingCaption}
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingCaption ? "Generating..." : "AI Generate"}
              </Button>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <Label>Schedule</Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  />
                </div>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="text-xs">
              💡 Suggested: Post at 9:00 AM (best engagement time)
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                  U
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">@username</span>
                    <span className="text-xs text-muted-foreground">• Just now</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {caption || "Your caption will appear here..."}
                  </p>
                  {media.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {media.slice(0, 4).map((item, index) => (
                        <div key={index} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                          {item.type === "image" ? (
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          ) : (
                            <Video className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting || !caption.trim()}
            >
              {isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={() => handleSubmit("schedule")}
              disabled={isSubmitting || !caption.trim() || !selectedDate || !selectedTime || charError}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Scheduling..." : "Schedule Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
