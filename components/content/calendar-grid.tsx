"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Image as ImageIcon, Video, FileText } from "lucide-react";
import { PostCard } from "./post-card";
import { type ScheduledPost } from "@/lib/api/scheduled-posts";

interface CalendarGridProps {
  days: Date[];
  posts: ScheduledPost[];
  onCreatePost: (date: Date, time?: string) => void;
  onRefresh: () => void;
  onEditPost?: (postId: number) => void;
  onDeletePost?: (postId: number) => void;
}

export function CalendarGrid({ days, posts, onCreatePost, onRefresh, onEditPost, onDeletePost }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get all posts for a specific date (regardless of time)
  const getPostsForDay = (date: Date) => {
    const filtered = posts.filter((post) => {
      if (!post.scheduled_at) return false;

      // For posted posts, use posted_at date if available
      // Otherwise use scheduled_at
      const relevantTime = post.status === "posted" && post.posted_at
        ? new Date(post.posted_at)
        : new Date(post.scheduled_at);

      const matches = relevantTime.toDateString() === date.toDateString();

      // Debug logging
      if (post.status === "posted") {
        console.log(`Posted post ${post.id}:`, {
          scheduled_at: post.scheduled_at,
          posted_at: post.posted_at,
          relevantTime: relevantTime.toDateString(),
          checkingDate: date.toDateString(),
          matches
        });
      }

      return matches;
    }).sort((a, b) => {
      // Sort by time
      const timeA = a.status === "posted" && a.posted_at
        ? new Date(a.posted_at)
        : new Date(a.scheduled_at);
      const timeB = b.status === "posted" && b.posted_at
        ? new Date(b.posted_at)
        : new Date(b.scheduled_at);
      return timeA.getTime() - timeB.getTime();
    });

    return filtered;
  };

  // Format day header
  const formatDayHeader = (date: Date, index: number) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div className={`text-center p-4 ${isToday ? 'bg-primary/10' : ''}`} suppressHydrationWarning>
        <div className="text-sm font-medium text-muted-foreground uppercase">
          {dayName}
        </div>
        <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-primary' : ''}`}>
          {dayNum}
        </div>
        {isToday && (
          <div className="text-xs text-primary font-medium mt-1">Today</div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Calendar Header - Days */}
      <div className="grid grid-cols-7 border-b">
        {days.map((day, index) => (
          <div key={index} className="border-r last:border-r-0">
            {formatDayHeader(day, index)}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x">
        {days.map((day, dayIndex) => {
          const dayPosts = getPostsForDay(day);

          return (
            <div
              key={dayIndex}
              className={`min-h-[600px] p-3 hover:bg-muted/50 transition-colors ${
                selectedDate?.toDateString() === day.toDateString()
                  ? 'bg-primary/5'
                  : ''
              }`}
              onClick={() => setSelectedDate(day)}
            >
              {/* Posts for this day */}
              <ScrollArea className="h-[580px]">
                <div className="space-y-2 pr-3">
                  {dayPosts.map((post) => {
                    // Transform API post to PostCard format
                    const postDate = new Date(post.scheduled_at || new Date());
                    const postedDate = post.posted_at ? new Date(post.posted_at) : null;
                    const transformedPost = {
                      id: String(post.id),
                      date: postDate,
                      time: postDate.toTimeString().substring(0, 5),
                      content: post.content,
                      media: post.media_urls?.map((url) => ({
                        type: url.match(/\.(mp4|mov|avi)$/i) ? "video" : "image",
                        url
                      })) || [],
                      status: post.status as "draft" | "scheduled" | "posted" | "failed",
                      postedAt: postedDate ? postedDate.toTimeString().substring(0, 5) : undefined
                    };

                    return (
                      <PostCard
                        key={post.id}
                        post={transformedPost}
                        compact
                        onEdit={onEditPost ? (id) => onEditPost(Number(id)) : undefined}
                        onDelete={onDeletePost ? (id) => onDeletePost(Number(id)) : undefined}
                      />
                    );
                  })}

                  {/* Add Post Button */}
                  {dayPosts.length === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-auto py-24 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                      onClick={() => onCreatePost(day)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="border-t bg-muted/30 px-6 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{posts.length} posts</span> for this week
        </p>
      </div>
    </div>
  );
}
