"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Link,
  Bot,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Chrome,
  MessageSquare,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  gradient: string;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Parallel Universe",
    description:
      "Congratulations on taking the first step to supercharge your X presence! Let's walk you through how to grow your account on autopilot.",
    icon: <Sparkles className="h-16 w-16 text-primary" />,
    gradient: "from-primary/20 via-primary/10 to-transparent",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>With Parallel Universe, you'll be able to:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Grow your followers and engagement automatically</span>
          </li>
          <li className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            <span>Generate AI-powered content in your voice</span>
          </li>
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Engage with your target audience strategically</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "connect",
    title: "Connect Your X Account",
    description:
      "First, you'll need to connect your X (Twitter) account using our secure Chrome extension.",
    icon: <Link className="h-16 w-16 text-blue-500" />,
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Chrome className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Chrome Extension Required</p>
            <p className="text-sm">
              Install our extension and log into X. We'll securely sync your session
              to enable the AI agent to act on your behalf.
            </p>
          </div>
        </div>
        <p className="text-sm">
          Your credentials are never stored - we only use secure session cookies that
          you can revoke anytime.
        </p>
      </div>
    ),
  },
  {
    id: "agent",
    title: "Meet Your AI Growth Agent",
    description:
      "Your personal AI agent learns your writing style and engages with your target audience 24/7.",
    icon: <Bot className="h-16 w-16 text-purple-500" />,
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>The AI agent works for you by:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            <span>Finding and engaging with accounts in your niche</span>
          </li>
          <li className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple-500" />
            <span>Writing thoughtful comments that sound like you</span>
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span>Strategically liking and following to maximize visibility</span>
          </li>
        </ul>
        <p className="text-sm">
          Chat with your agent on the dashboard to give it instructions or ask for
          engagement reports.
        </p>
      </div>
    ),
  },
  {
    id: "calendar",
    title: "Content Calendar",
    description:
      "Plan and schedule your posts with AI-generated content tailored to your voice and audience.",
    icon: <Calendar className="h-16 w-16 text-green-500" />,
    gradient: "from-green-500/20 via-green-500/10 to-transparent",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>The Content Calendar helps you:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-500" />
            <span>Generate post ideas based on trending topics</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>Schedule posts for optimal engagement times</span>
          </li>
          <li className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <span>Create threads that establish thought leadership</span>
          </li>
        </ul>
        <p className="text-sm">
          Access it from the <strong>Content Calendar</strong> tab in the navigation.
        </p>
      </div>
    ),
  },
  {
    id: "automations",
    title: "Automations & Scheduling",
    description:
      "Set up recurring engagement tasks that run automatically based on your preferences.",
    icon: <Clock className="h-16 w-16 text-orange-500" />,
    gradient: "from-orange-500/20 via-orange-500/10 to-transparent",
    content: (
      <div className="space-y-4 text-muted-foreground">
        <p>Automate your growth with:</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span>Scheduled engagement sessions (likes, comments, follows)</span>
          </li>
          <li className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            <span>Daily content generation on autopilot</span>
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span>Competitor monitoring and engagement</span>
          </li>
        </ul>
        <p className="text-sm">
          Configure your automations in the <strong>Automations</strong> tab. You can
          pause or resume them anytime.
        </p>
      </div>
    ),
  },
];

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden gap-0"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Gradient header with icon */}
        <div
          className={cn(
            "h-48 flex items-center justify-center bg-gradient-to-b",
            step.gradient
          )}
        >
          <div className="p-6 rounded-full bg-background/80 backdrop-blur-sm shadow-lg">
            {step.icon}
          </div>
        </div>

        {/* Content area */}
        <div className="p-8 space-y-4">
          <h2 className="text-2xl font-bold">{step.title}</h2>
          <p className="text-muted-foreground text-lg">{step.description}</p>
          <div className="pt-2">{step.content}</div>
        </div>

        {/* Footer with progress and buttons */}
        <div className="p-6 border-t flex items-center justify-between bg-muted/30">
          {/* Progress dots */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-6 bg-primary"
                    : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tour
            </Button>
            <Button onClick={handleNext}>
              {isLastStep ? "Get Started" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
