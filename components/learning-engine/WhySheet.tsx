"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  Sparkles,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Recommendation } from "@/hooks/useRecommendations";

interface ContextualReason {
  id: string;
  label: string;
  isContextual: boolean; // true = LLM generated, false = static
}

interface WhySheetProps {
  isOpen: boolean;
  decision: "yes" | "no" | null;
  recommendation: Recommendation | null;
  reasons: ContextualReason[];
  isLoadingReasons: boolean;
  onSubmit: (selectedReasons: string[], otherReason?: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export function WhySheet({
  isOpen,
  decision,
  recommendation,
  reasons,
  isLoadingReasons,
  onSubmit,
  onClose,
  isSubmitting,
}: WhySheetProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [showOther, setShowOther] = useState(false);

  // Reset state when sheet opens with new decision
  useEffect(() => {
    if (isOpen) {
      setSelectedReasons([]);
      setOtherReason("");
      setShowOther(false);
    }
  }, [isOpen, decision]);

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonId)
        ? prev.filter((r) => r !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedReasons, otherReason || undefined);
  };

  const canSubmit = selectedReasons.length > 0 || otherReason.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      decision === "yes"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {decision === "yes" ? (
                      <ThumbsUp className="w-5 h-5" />
                    ) : (
                      <ThumbsDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {decision === "yes" ? "Why would you engage?" : "Why not?"}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Help us understand your preferences
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Post Preview */}
              {recommendation && (
                <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      @{recommendation.post.author}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {Math.round(recommendation.score * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {recommendation.post.content}
                  </p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
              {isLoadingReasons ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
                  <p className="text-sm text-zinc-400">
                    Generating personalized options...
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI is analyzing this post
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Contextual reasons (LLM generated) */}
                  {reasons.filter(r => r.isContextual).length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-medium text-orange-300 uppercase tracking-wide">
                          For this post
                        </span>
                      </div>
                      <div className="space-y-2">
                        {reasons
                          .filter((r) => r.isContextual)
                          .map((reason) => (
                            <label
                              key={reason.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                                selectedReasons.includes(reason.id)
                                  ? decision === "yes"
                                    ? "bg-green-500/15 border-2 border-green-500/50"
                                    : "bg-red-500/15 border-2 border-red-500/50"
                                  : "bg-zinc-800/50 border-2 border-transparent hover:border-zinc-700"
                              )}
                            >
                              <Checkbox
                                checked={selectedReasons.includes(reason.id)}
                                onCheckedChange={() => handleReasonToggle(reason.id)}
                                className={cn(
                                  "w-5 h-5",
                                  decision === "yes"
                                    ? "border-green-500 data-[state=checked]:bg-green-600"
                                    : "border-red-500 data-[state=checked]:bg-red-600"
                                )}
                              />
                              <span className="text-sm text-zinc-200">{reason.label}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* General reasons (static) */}
                  {reasons.filter(r => !r.isContextual).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3 block">
                        General reasons
                      </span>
                      <div className="space-y-2">
                        {reasons
                          .filter((r) => !r.isContextual)
                          .map((reason) => (
                            <label
                              key={reason.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                                selectedReasons.includes(reason.id)
                                  ? decision === "yes"
                                    ? "bg-green-500/15 border-2 border-green-500/50"
                                    : "bg-red-500/15 border-2 border-red-500/50"
                                  : "bg-zinc-800/50 border-2 border-transparent hover:border-zinc-700"
                              )}
                            >
                              <Checkbox
                                checked={selectedReasons.includes(reason.id)}
                                onCheckedChange={() => handleReasonToggle(reason.id)}
                                className={cn(
                                  "w-5 h-5",
                                  decision === "yes"
                                    ? "border-green-500 data-[state=checked]:bg-green-600"
                                    : "border-red-500 data-[state=checked]:bg-red-600"
                                )}
                              />
                              <span className="text-sm text-zinc-200">{reason.label}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Other reason */}
                  <div className="pt-2">
                    {!showOther ? (
                      <button
                        onClick={() => setShowOther(true)}
                        className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        + Add your own reason
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs text-zinc-500">Your reason</label>
                        <Textarea
                          value={otherReason}
                          onChange={(e) => setOtherReason(e.target.value)}
                          placeholder="Tell us more about why..."
                          className="h-20 bg-zinc-800 border-zinc-700 text-sm resize-none focus:border-orange-500/50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting || isLoadingReasons}
                className={cn(
                  "w-full h-12 text-base font-semibold",
                  decision === "yes"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-zinc-500 mt-3">
                Your feedback trains your personalized recommendation model
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
