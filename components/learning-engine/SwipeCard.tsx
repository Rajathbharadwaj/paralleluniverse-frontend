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
  Clock,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
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

        <CardContent className="p-6 space-y-5">
          {/* Post Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {post.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-white text-lg">@{post.author}</div>
                <div className="text-sm text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {post.hours_ago < 1
                    ? "Just now"
                    : post.hours_ago < 24
                    ? `${Math.round(post.hours_ago)}h ago`
                    : `${Math.round(post.hours_ago / 24)}d ago`}
                </div>
              </div>
            </div>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-orange-400 transition-colors p-2 hover:bg-zinc-800 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>

          {/* Post Content */}
          <p className="text-base text-zinc-200 leading-relaxed line-clamp-6">
            {post.content}
          </p>

          {/* Engagement Stats */}
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
              <Heart className="w-4 h-4" />
              {formatNumber(post.likes)}
            </span>
            <span className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
              {formatNumber(post.replies)}
            </span>
            <span className="flex items-center gap-1.5 hover:text-green-400 transition-colors">
              <Repeat2 className="w-4 h-4" />
              {formatNumber(post.retweets)}
            </span>
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
