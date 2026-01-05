"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Repeat2,
  ExternalLink,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Recommendation } from "@/hooks/useRecommendations";

interface SwipeCardProps {
  recommendation: Recommendation;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
  index: number;
}

export function SwipeCard({ recommendation, onSwipe, isTop, index }: SwipeCardProps) {
  const { post, score, reason } = recommendation;

  // Motion values for drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Color overlays based on swipe direction
  const leftOverlayOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 100], [0, 1]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      onSwipe("left");
    }
    setIsDragging(false);
  };

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  // Stack effect - cards behind are smaller and offset
  const stackOffset = index * 8;
  const stackScale = 1 - index * 0.05;

  return (
    <motion.div
      className={cn(
        "absolute w-full cursor-grab active:cursor-grabbing",
        !isTop && "pointer-events-none"
      )}
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1 - index * 0.15,
        scale: stackScale,
        top: stackOffset,
        zIndex: 10 - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{
        scale: stackScale,
        opacity: 1 - index * 0.15,
        y: 0,
        top: stackOffset
      }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.3 }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className="w-full bg-zinc-900 border-zinc-800 overflow-hidden shadow-2xl">
        {/* Swipe Indicators */}
        {isTop && (
          <>
            {/* Left (No) overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-transparent z-10 pointer-events-none flex items-center justify-start pl-8"
              style={{ opacity: leftOverlayOpacity }}
            >
              <div className="bg-red-500 rounded-full p-4 shadow-lg shadow-red-500/50">
                <ThumbsDown className="w-8 h-8 text-white" />
              </div>
            </motion.div>

            {/* Right (Yes) overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-l from-green-500/30 to-transparent z-10 pointer-events-none flex items-center justify-end pr-8"
              style={{ opacity: rightOverlayOpacity }}
            >
              <div className="bg-green-500 rounded-full p-4 shadow-lg shadow-green-500/50">
                <ThumbsUp className="w-8 h-8 text-white" />
              </div>
            </motion.div>
          </>
        )}

        <CardContent className="p-5 space-y-4">
          {/* Post Header - X/Twitter style */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {post.author.charAt(0).toUpperCase()}
            </div>

            {/* User Info + External Link */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Display name */}
                  <span className="font-bold text-white truncate">
                    {post.author}
                  </span>
                  {/* Handle + Time with separator */}
                  <span className="text-zinc-500 truncate">
                    @{post.author}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500 whitespace-nowrap">
                    {post.hours_ago < 1
                      ? "now"
                      : post.hours_ago < 24
                      ? `${Math.round(post.hours_ago)}h`
                      : `${Math.round(post.hours_ago / 24)}d`}
                  </span>
                </div>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-blue-400 transition-colors p-1.5 hover:bg-zinc-800/50 rounded-full ml-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-[15px] text-zinc-100 leading-relaxed line-clamp-6 whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Engagement Stats - X/Twitter style */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-5">
              {/* Replies */}
              <span className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 transition-colors group">
                <MessageCircle className="w-[18px] h-[18px] group-hover:bg-blue-400/10 rounded-full p-0.5 -m-0.5" />
                <span className="text-sm">{formatNumber(post.replies)}</span>
              </span>
              {/* Retweets */}
              <span className="flex items-center gap-1.5 text-zinc-500 hover:text-green-400 transition-colors group">
                <Repeat2 className="w-[18px] h-[18px] group-hover:bg-green-400/10 rounded-full p-0.5 -m-0.5" />
                <span className="text-sm">{formatNumber(post.retweets)}</span>
              </span>
              {/* Likes */}
              <span className="flex items-center gap-1.5 text-zinc-500 hover:text-pink-500 transition-colors group">
                <Heart className="w-[18px] h-[18px] group-hover:bg-pink-500/10 rounded-full p-0.5 -m-0.5" />
                <span className="text-sm">{formatNumber(post.likes)}</span>
              </span>
              {/* Views (if available) */}
              {post.author_followers && post.author_followers > 0 && (
                <span className="flex items-center gap-1.5 text-zinc-500 transition-colors">
                  <Eye className="w-[18px] h-[18px]" />
                  <span className="text-sm">{formatNumber(post.author_followers)}</span>
                </span>
              )}
            </div>
          </div>

          {/* AI Recommendation Reason */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-purple-500/10 border border-orange-500/20">
            <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm text-orange-100">{reason}</span>
            </div>
            <Badge
              variant="outline"
              className="border-orange-500/40 text-orange-300 bg-orange-500/10 font-semibold"
            >
              {Math.round(score * 100)}%
            </Badge>
          </div>

          {/* Swipe Hint */}
          {isTop && !isDragging && (
            <div className="flex items-center justify-center gap-8 pt-2 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-400" />
                Swipe left to pass
              </span>
              <span className="flex items-center gap-2">
                Swipe right to engage
                <ThumbsUp className="w-4 h-4 text-green-400" />
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
