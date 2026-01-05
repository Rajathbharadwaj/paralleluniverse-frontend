"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Repeat2,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Recommendation, ReasonOption } from "@/hooks/useRecommendations";

interface RecommendationCardProps {
  recommendation: Recommendation;
  reasonOptions: ReasonOption[] | null;
  onDecision: (
    decision: "yes" | "no",
    selectedReasons: string[],
    otherReason?: string,
    timeMs?: number
  ) => void;
  isProcessing?: boolean;
}

export function RecommendationCard({
  recommendation,
  reasonOptions,
  onDecision,
  isProcessing = false,
}: RecommendationCardProps) {
  const [decision, setDecision] = useState<"yes" | "no" | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [showReasons, setShowReasons] = useState(false);
  const [startTime] = useState(Date.now());

  const { post, score, reason } = recommendation;

  // Filter reasons based on decision
  const filteredReasons = reasonOptions?.filter(
    (r) => r.category === (decision === "yes" ? "positive" : "negative")
  );

  const handleDecisionClick = (d: "yes" | "no") => {
    if (decision === d) {
      // Toggle off
      setDecision(null);
      setSelectedReasons([]);
      setShowReasons(false);
    } else {
      setDecision(d);
      setSelectedReasons([]);
      setShowReasons(true);
    }
  };

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((r) => r !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleSubmit = () => {
    if (!decision) return;
    const timeMs = Date.now() - startTime;
    onDecision(
      decision,
      selectedReasons,
      otherReason || undefined,
      timeMs
    );
  };

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Post Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
              {post.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-white">@{post.author}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
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
            className="text-zinc-500 hover:text-orange-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Post Content */}
        <p className="text-sm text-zinc-300 line-clamp-4">{post.content}</p>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {formatNumber(post.likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {formatNumber(post.replies)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="w-3.5 h-3.5" />
            {formatNumber(post.retweets)}
          </span>
        </div>

        {/* Recommendation Reason */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/20">
          <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-xs text-orange-200">{reason}</span>
          <Badge variant="outline" className="ml-auto text-[10px] border-orange-500/30 text-orange-300">
            {Math.round(score * 100)}% match
          </Badge>
        </div>

        {/* Decision Buttons */}
        <div className="space-y-3">
          <p className="text-sm text-zinc-400 font-medium">Would you engage with this post?</p>
          <div className="flex gap-2">
            <Button
              variant={decision === "yes" ? "default" : "outline"}
              className={cn(
                "flex-1",
                decision === "yes"
                  ? "bg-green-600 hover:bg-green-700 border-green-600"
                  : "border-zinc-700 hover:border-green-600 hover:text-green-400"
              )}
              onClick={() => handleDecisionClick("yes")}
              disabled={isProcessing}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Yes
            </Button>
            <Button
              variant={decision === "no" ? "default" : "outline"}
              className={cn(
                "flex-1",
                decision === "no"
                  ? "bg-red-600 hover:bg-red-700 border-red-600"
                  : "border-zinc-700 hover:border-red-600 hover:text-red-400"
              )}
              onClick={() => handleDecisionClick("no")}
              disabled={isProcessing}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              No
            </Button>
          </div>
        </div>

        {/* Reason Selection (Expandable) */}
        {decision && showReasons && (
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-300"
            >
              {showReasons ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Why {decision === "yes" ? "would you engage" : "not"}?
            </button>

            <div className="space-y-2">
              {filteredReasons?.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                    selectedReasons.includes(option.id)
                      ? decision === "yes"
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-red-500/10 border border-red-500/30"
                      : "bg-zinc-800/50 border border-transparent hover:border-zinc-700"
                  )}
                >
                  <Checkbox
                    checked={selectedReasons.includes(option.id)}
                    onCheckedChange={() => handleReasonToggle(option.id)}
                    className={cn(
                      decision === "yes"
                        ? "border-green-500 data-[state=checked]:bg-green-600"
                        : "border-red-500 data-[state=checked]:bg-red-600"
                    )}
                  />
                  <span className="text-sm text-zinc-300">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Other Reason */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">Other reason (optional)</label>
              <Textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Tell us more..."
                className="h-16 bg-zinc-800 border-zinc-700 text-sm resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || selectedReasons.length === 0}
              className={cn(
                "w-full",
                decision === "yes"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isProcessing ? "Saving..." : "Submit Feedback"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
