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
import { Loader2, CheckCircle2 } from "lucide-react";
import { VNCViewer } from "@/components/vnc-viewer";
import { useVNCSession } from "@/hooks/useVNCSession";

interface ConnectXDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (username: string) => void;
}

export function ConnectXDialog({ open, onOpenChange, onSuccess }: ConnectXDialogProps) {
  const [step, setStep] = useState<"loading" | "vnc" | "detecting" | "success">("loading");
  const [username, setUsername] = useState("");
  const { vncUrl, isLoading: vncLoading, error: vncError } = useVNCSession();

  useEffect(() => {
    if (open) {
      // Step 1: Initialize browser
      setStep("loading");
      
      // Simulate API call to start browser and navigate to X login
      setTimeout(async () => {
        try {
          // TODO: Replace with actual API call
          // await fetch('/api/onboard/connect-x', { method: 'POST' });
          setStep("vnc");
        } catch (error) {
          console.error("Failed to start browser:", error);
        }
      }, 2000);
    }
  }, [open]);

  const handleDetectLogin = async () => {
    setStep("detecting");
    
    // TODO: Replace with actual API call
    // const response = await fetch('/api/onboard/confirm-login', { method: 'POST' });
    // const data = await response.json();
    
    // Simulate detection
    setTimeout(() => {
      const detectedUsername = "your_username"; // This will come from API
      setUsername(detectedUsername);
      setStep("success");
      
      setTimeout(() => {
        onSuccess(detectedUsername);
      }, 1500);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Connect Your X Account</DialogTitle>
          <DialogDescription>
            {step === "loading" && "Setting up secure browser..."}
            {step === "vnc" && "Log in to your X account in the browser below"}
            {step === "detecting" && "Detecting login..."}
            {step === "success" && "Successfully connected!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Initializing secure browser environment...
              </p>
            </div>
          )}

          {step === "vnc" && (
            <>
              <div className="border rounded-lg overflow-hidden bg-black" style={{ height: "600px" }}>
                {/* Real VNC Viewer */}
                {vncLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <span className="font-bold text-primary">1.</span>
                  <p>Log in to your X account in the browser above</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-primary">2.</span>
                  <p>Wait until you see your X home feed</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-primary">3.</span>
                  <p>Click "I'm Logged In" below</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleDetectLogin}
                >
                  I'm Logged In
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                🔒 Your password is never shared with us. You're logging in directly to X.
              </p>
            </>
          )}

          {step === "detecting" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
                  Account: <span className="font-mono font-bold">@{username}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

