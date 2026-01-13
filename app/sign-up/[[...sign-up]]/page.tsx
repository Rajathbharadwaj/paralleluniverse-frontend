"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LegalFooter } from "@/components/legal-footer";

interface FormData {
  role: string;
  platform: string;
  mainConcern: string;
  philosophy: string;
  manualFirstOk: string;
  openToConversation: string;
  additionalNotes: string;
  email: string;
  linkedinUrl: string;
}

export default function EarlyAccessPage() {
  const [formData, setFormData] = useState<FormData>({
    role: "",
    platform: "",
    mainConcern: "",
    philosophy: "",
    manualFirstOk: "",
    openToConversation: "",
    additionalNotes: "",
    email: "",
    linkedinUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit. Please try again.");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Thank you for your interest</h1>
          <p className="text-muted-foreground mb-6">
            We've received your request. If there's a fit, we'll be in touch soon.
          </p>
          <Link href="/landing">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        {/* Back button */}
        <Link href="/landing">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Request Early Access</h1>
          <p className="text-muted-foreground">
            Parallel Universe is onboarding a small group of founders and operators
            who value restraint over hacks.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">What best describes you? *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="founder_operator">Founder / Operator</SelectItem>
                <SelectItem value="solo_builder">Solo builder</SelectItem>
                <SelectItem value="smb_owner">SMB owner</SelectItem>
                <SelectItem value="marketer_growth">Marketer / Growth</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">
              Where would you want delegated presence the most right now? *
            </Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData({ ...formData, platform: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x_twitter">X / Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="local_business">Local business visibility</SelectItem>
                <SelectItem value="customer_messages">Customer messages</SelectItem>
                <SelectItem value="figuring_out">Still figuring it out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Main Concern */}
          <div className="space-y-2">
            <Label htmlFor="mainConcern">
              What worries you most about automating your online presence? *
            </Label>
            <Textarea
              id="mainConcern"
              placeholder="e.g. Losing my voice, saying the wrong thing, overposting, sounding inauthentic, reputation risk..."
              value={formData.mainConcern}
              onChange={(e) => setFormData({ ...formData, mainConcern: e.target.value })}
              className="min-h-[100px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              This tells us everything about what matters to you.
            </p>
          </div>

          {/* Philosophy */}
          <div className="space-y-3">
            <Label>Which statement do you agree with more? *</Label>
            <RadioGroup
              value={formData.philosophy}
              onValueChange={(value: string) => setFormData({ ...formData, philosophy: value })}
              required
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="growth_first" id="growth_first" />
                <Label htmlFor="growth_first" className="cursor-pointer font-normal">
                  "Growth matters more than restraint — I can clean things up later"
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="trust_first" id="trust_first" />
                <Label htmlFor="trust_first" className="cursor-pointer font-normal">
                  "One bad reply can undo months of trust"
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Manual-first acceptance */}
          <div className="space-y-3">
            <Label>
              If Parallel Universe started partially manual while learning your voice,
              would that be acceptable? *
            </Label>
            <RadioGroup
              value={formData.manualFirstOk}
              onValueChange={(value: string) => setFormData({ ...formData, manualFirstOk: value })}
              required
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="yes" id="manual_yes" />
                <Label htmlFor="manual_yes" className="cursor-pointer font-normal">
                  Yes — safety {">"} speed
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="depends" id="manual_depends" />
                <Label htmlFor="manual_depends" className="cursor-pointer font-normal">
                  Depends on time commitment
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="no" id="manual_no" />
                <Label htmlFor="manual_no" className="cursor-pointer font-normal">
                  No — I expect full automation
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Open to conversation */}
          <div className="space-y-3">
            <Label>
              Would you be open to a short conversation if this feels like a fit? *
            </Label>
            <RadioGroup
              value={formData.openToConversation}
              onValueChange={(value: string) => setFormData({ ...formData, openToConversation: value })}
              required
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="yes" id="convo_yes" />
                <Label htmlFor="convo_yes" className="cursor-pointer font-normal">
                  Yes
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="maybe" id="convo_maybe" />
                <Label htmlFor="convo_maybe" className="cursor-pointer font-normal">
                  Maybe later
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="no" id="convo_no" />
                <Label htmlFor="convo_no" className="cursor-pointer font-normal">
                  Not right now
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Anything else you want us to know?</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Optional"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          {/* Contact info */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn profile (optional)</Label>
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Request Early Access"
            )}
          </Button>

          {/* Terms notice */}
          <p className="text-sm text-muted-foreground text-center">
            By submitting, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>

      <LegalFooter />
    </div>
  );
}
