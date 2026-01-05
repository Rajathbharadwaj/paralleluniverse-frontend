"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { WhySheet } from "./WhySheet";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, RotateCcw, Sparkles } from "lucide-react";
import { Recommendation } from "@/hooks/useRecommendations";

interface ContextualReason {
  id: string;
  label: string;
  isContextual: boolean;
}

interface CardDeckProps {
  recommendations: Recommendation[];
  onFeedback: (
    recommendationId: number,
    decision: "yes" | "no",
    selectedReasons: string[],
    otherReason?: string
  ) => Promise<void>;
  onLoadMore: () => void;
  onGetReasons: (
    recommendation: Recommendation,
    decision: "yes" | "no"
  ) => Promise<ContextualReason[]>;
  completedCount: number;
  sessionTotal?: number;
  hasQueuedPosts?: boolean;
}

export function CardDeck({
  recommendations,
  onFeedback,
  onLoadMore,
  onGetReasons,
  completedCount,
  sessionTotal,
  hasQueuedPosts,
}: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedCards, setSwipedCards] = useState<number[]>([]);
  const [pendingDecision, setPendingDecision] = useState<{
    recommendation: Recommendation;
    decision: "yes" | "no";
  } | null>(null);
  const [reasons, setReasons] = useState<ContextualReason[]>([]);
  const [isLoadingReasons, setIsLoadingReasons] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get visible cards (current + next 2 for stack effect)
  const visibleCards = recommendations
    .slice(currentIndex, currentIndex + 3)
    .filter((_, i) => !swipedCards.includes(currentIndex + i));

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      const decision = direction === "right" ? "yes" : "no";
      const currentRec = recommendations[currentIndex];

      if (!currentRec) return;

      // Mark card as swiped
      setSwipedCards((prev) => [...prev, currentIndex]);

      // Store pending decision and open sheet
      setPendingDecision({ recommendation: currentRec, decision });

      // Fetch contextual reasons from LLM
      setIsLoadingReasons(true);
      try {
        const contextualReasons = await onGetReasons(currentRec, decision);
        setReasons(contextualReasons);
      } catch (error) {
        console.error("Failed to get reasons:", error);
        // Fall back to empty reasons (sheet will still work)
        setReasons([]);
      } finally {
        setIsLoadingReasons(false);
      }
    },
    [currentIndex, recommendations, onGetReasons]
  );

  const handleButtonSwipe = (direction: "left" | "right") => {
    handleSwipe(direction);
  };

  const handleSubmitFeedback = async (
    selectedReasons: string[],
    otherReason?: string
  ) => {
    if (!pendingDecision) return;

    setIsSubmitting(true);
    try {
      await onFeedback(
        pendingDecision.recommendation.id,
        pendingDecision.decision,
        selectedReasons,
        otherReason
      );

      // Move to next card
      setCurrentIndex((prev) => prev + 1);
      setPendingDecision(null);
      setReasons([]);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSheet = () => {
    // Undo the swipe - remove from swiped cards
    setSwipedCards((prev) => prev.filter((i) => i !== currentIndex));
    setPendingDecision(null);
    setReasons([]);
  };

  const remainingCards = recommendations.length - currentIndex;
  const isComplete = remainingCards === 0 || currentIndex >= recommendations.length;

  return (
    <div className="flex flex-col items-center">
      {/* Card Stack */}
      <div className="relative w-full max-w-md h-[520px] mb-6">
        {isComplete ? (
          // Completed state
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              All caught up!
            </h3>
            <p className="text-zinc-400 mb-6 max-w-sm">
              You've reviewed all {sessionTotal || recommendations.length} posts. Your feedback is training your
              personalized recommendation model.
            </p>
            <Button onClick={onLoadMore} size="lg" className="px-8">
              {hasQueuedPosts ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Show Next Batch
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Load More Posts
                </>
              )}
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleCards.map((rec, index) => (
              <SwipeCard
                key={rec.id}
                recommendation={rec}
                onSwipe={handleSwipe}
                isTop={index === 0 && !pendingDecision}
                index={index}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Action Buttons */}
      {!isComplete && !pendingDecision && (
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleButtonSwipe("left")}
            className="w-16 h-16 rounded-full border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 transition-all group"
          >
            <ThumbsDown className="w-7 h-7 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all" />
          </Button>

          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1">
              {currentIndex + 1} of {recommendations.length}
            </p>
            <p className="text-sm text-zinc-400">Swipe or tap</p>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleButtonSwipe("right")}
            className="w-16 h-16 rounded-full border-2 border-green-500/50 hover:border-green-500 hover:bg-green-500/10 transition-all group"
          >
            <ThumbsUp className="w-7 h-7 text-green-400 group-hover:text-green-300 group-hover:scale-110 transition-all" />
          </Button>
        </div>
      )}

      {/* Progress dots */}
      {!isComplete && (
        <div className="flex items-center gap-1.5 mt-6">
          {recommendations.slice(0, Math.min(10, recommendations.length)).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i < currentIndex
                  ? "bg-orange-500"
                  : i === currentIndex
                  ? "bg-white w-3"
                  : "bg-zinc-700"
              }`}
            />
          ))}
          {recommendations.length > 10 && (
            <span className="text-xs text-zinc-500 ml-2">
              +{recommendations.length - 10} more
            </span>
          )}
        </div>
      )}

      {/* Why Sheet */}
      <WhySheet
        isOpen={!!pendingDecision}
        decision={pendingDecision?.decision || null}
        recommendation={pendingDecision?.recommendation || null}
        reasons={reasons}
        isLoadingReasons={isLoadingReasons}
        onSubmit={handleSubmitFeedback}
        onClose={handleCloseSheet}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
