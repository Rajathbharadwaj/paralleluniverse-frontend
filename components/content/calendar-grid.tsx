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
}

export function CalendarGrid({ days, posts, onCreatePost, onRefresh }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Time slots for each day (9am, 2pm, 6pm)
  const timeSlots = ["09:00", "14:00", "18:00"];

  // Get posts for a specific date and time
  const getPostsForSlot = (date: Date, time: string) => {
    return posts.filter((post) => {
      if (!post.scheduled_at) return false;
      const postDate = new Date(post.scheduled_at);
      const postTime = postDate.toTimeString().substring(0, 5);

      return (
        postDate.toDateString() === date.toDateString() &&
        postTime === time
      );
    });
  };

  // Format day header
  const formatDayHeader = (date: Date, index: number) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div className={`text-center p-4 ${isToday ? 'bg-primary/10' : ''}`}>
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

      {/* Time Slots Grid */}
      <div className="grid grid-cols-7 divide-x">
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="min-h-[600px]">
            {timeSlots.map((time, timeIndex) => {
              const posts = getPostsForSlot(day, time);

              return (
                <div
                  key={timeIndex}
                  className={`border-b last:border-b-0 p-3 min-h-[200px] hover:bg-muted/50 transition-colors ${
                    selectedDate?.toDateString() === day.toDateString()
                      ? 'bg-primary/5'
                      : ''
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  {/* Time Label */}
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {time}
                  </div>

                  {/* Posts for this slot */}
                  <div className="space-y-2">
                    {posts.map((post) => {
                      // Transform API post to PostCard format
                      const postDate = new Date(post.scheduled_at || new Date());
                      const transformedPost = {
                        id: String(post.id),
                        date: postDate,
                        time: postDate.toTimeString().substring(0, 5),
                        content: post.content,
                        media: post.media_urls?.map((url) => ({
                          type: url.match(/\.(mp4|mov|avi)$/i) ? "video" : "image",
                          url
                        })) || [],
                        status: post.status as "draft" | "scheduled" | "posted" | "failed"
                      };

                      return <PostCard key={post.id} post={transformedPost} compact />;
                    })}
                  </div>

                  {/* Add Post Button */}
                  {posts.length === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-auto py-8 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                      onClick={() => onCreatePost(day, time)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="border-t bg-muted/30 px-6 py-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{posts.length} posts</span> scheduled this week •
          <span className="font-medium ml-1">{(days.length * timeSlots.length) - posts.length} slots</span> available
        </p>
      </div>
    </div>
  );
}
