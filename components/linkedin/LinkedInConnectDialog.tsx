"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Linkedin } from "lucide-react";
import { VNCViewer } from "@/components/vnc-viewer";
import { useVNCSession } from "@/hooks/useVNCSession";

interface LinkedInConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (username: string) => void;
  userId: string;
}

export function LinkedInConnectDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
}: LinkedInConnectDialogProps) {
  const [step, setStep] = useState<"loading" | "vnc" | "detecting" | "success">("loading");
  const [username, setUsername] = useState("");
  const { vncUrl, isLoading: vncLoading, error: vncError } = useVNCSession();

  useEffect(() => {
    if (open) {
      setStep("loading");

      // Initialize browser and navigate to LinkedIn login
      setTimeout(async () => {
        try {
          // Navigate VNC browser to LinkedIn
          if (vncUrl) {
            // The VNC session should already be running
            // We just need to navigate to LinkedIn
            setStep("vnc");
          } else {
            setStep("vnc");
          }
        } catch (error) {
          console.error("Failed to start browser:", error);
        }
      }, 2000);
    }
  }, [open, vncUrl]);

  const handleDetectLogin = async () => {
    setStep("detecting");

    try {
      // Call backend to verify LinkedIn login and capture cookies
      const response = await fetch("/api/extension/linkedin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.username) {
          setUsername(data.username);
          setStep("success");

          setTimeout(() => {
            onSuccess(data.username);
          }, 1500);
          return;
        }
      }

      // If verification failed, go back to VNC step
      setStep("vnc");
      alert("Could not verify LinkedIn login. Please make sure you're logged in and try again.");
    } catch (error) {
      console.error("Error detecting login:", error);
      setStep("vnc");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            Connect Your LinkedIn Account
          </DialogTitle>
          <DialogDescription>
            {step === "loading" && "Setting up secure browser..."}
            {step === "vnc" && "Log in to your LinkedIn account in the browser below"}
            {step === "detecting" && "Detecting login..."}
            {step === "success" && "Successfully connected!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#0A66C2]" />
              <p className="text-sm text-muted-foreground">
                Initializing secure browser environment...
              </p>
            </div>
          )}

          {step === "vnc" && (
            <>
              <div
                className="border rounded-lg overflow-hidden bg-black"
                style={{ height: "600px" }}
              >
                {vncLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0A66C2]" />
                    <span className="ml-2 text-white">Starting your browser session...</span>
                  </div>
                ) : vncError ? (
                  <div className="flex items-center justify-center h-full text-red-500">
                    <span>Error: {vncError}</span>
                  </div>
                ) : vncUrl ? (
                  <VNCViewer
                    url={vncUrl}
                    onConnect={() => console.log("VNC connected")}
                    onDisconnect={() => console.log("VNC disconnected")}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span>No VNC session available</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-[#0A66C2]">1.</span>
                  <p>Log in to your LinkedIn account in the browser above</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-[#0A66C2]">2.</span>
                  <p>Wait until you see your LinkedIn home feed</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-[#0A66C2]">3.</span>
                  <p>Click "I'm Logged In" below</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-[#0A66C2] hover:bg-[#004182]"
                  onClick={handleDetectLogin}
                >
                  <Linkedin className="h-5 w-5 mr-2" />
                  I'm Logged In
                </Button>
                <Button size="lg" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Your password is never shared with us. You're logging in directly to LinkedIn.
              </p>
            </>
          )}

          {step === "detecting" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#0A66C2]" />
              <p className="text-sm text-muted-foreground">
                Verifying login and capturing session...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Successfully Connected!</p>
                <p className="text-sm text-muted-foreground">
                  LinkedIn account: <span className="font-mono font-bold">{username}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
