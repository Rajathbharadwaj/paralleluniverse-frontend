"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Download, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { fetchExtension, fetchBackendAuth } from "@/lib/api-client";

interface ConnectExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: (username: string) => void;
}

type ConnectionStep = "waiting" | "extension_found" | "x_login_needed" | "connecting" | "connected" | "error";

export function ConnectExtensionDialog({ open, onOpenChange, userId, onSuccess }: ConnectExtensionDialogProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<ConnectionStep>("waiting");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start/stop polling when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("waiting");
      setError("");
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [open]);

  const startPolling = () => {
    if (pollIntervalRef.current) return;

    setIsPolling(true);
    // Check immediately
    checkExtensionStatus();
    // Then poll every 2 seconds
    pollIntervalRef.current = setInterval(checkExtensionStatus, 2000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const checkExtensionStatus = async () => {
    try {
      const response = await fetchExtension(`/status?user_id=${userId}`);
      const data = await response.json();

      const usersList = data.users_with_info || data.users || [];
      const user = usersList.find((u: any) => u.userId === userId);

      if (!user) {
        // Extension not connected yet - user needs to refresh dashboard or open X
        setStep("waiting");
        return;
      }

      // Extension is connected
      if (!user.hasCookies || !user.username) {
        // Connected but no cookies - user needs to log into X
        setStep("x_login_needed");
        return;
      }

      // Has cookies! Stop polling and inject
      stopPolling();
      setUsername(user.username);
      setStep("connecting");

      // Inject cookies into Docker
      await injectCookies(user.username);

    } catch (err) {
      console.error('Failed to check extension status:', err);
      // Don't change step on network errors - keep polling
    }
  };

  const injectCookies = async (detectedUsername: string) => {
    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication error - please refresh the page');
        setStep("error");
        return;
      }

      const injectResponse = await fetchBackendAuth('/api/inject-cookies-to-docker', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const injectResult = await injectResponse.json();

      if (injectResult.success && injectResult.logged_in) {
        console.log('✅ Session injected into Docker! User:', injectResult.username);
        setStep("connected");
        setTimeout(() => onSuccess(injectResult.username), 1500);
      } else {
        // Cookie injection failed but we have cookies - still mark as connected
        // The VNC might not be ready yet
        console.log('⚠️ VNC injection pending:', injectResult.error);
        setStep("connected");
        setTimeout(() => onSuccess(detectedUsername), 1500);
      }
    } catch (injectErr) {
      console.error('Failed to inject cookies:', injectErr);
      // Still mark as connected - cookies are stored
      setStep("connected");
      setTimeout(() => onSuccess(detectedUsername), 1500);
    }
  };

  const handleOpenX = () => {
    window.open('https://x.com', '_blank');
  };

  const handleDownloadExtension = () => {
    window.open('https://docs.paralleluniverse.ai/downloads/parallel-universe-extension.zip', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Connect Your X Account</DialogTitle>
          <DialogDescription>
            We'll detect your X login automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Extension */}
          <div className={`flex items-start gap-4 p-4 rounded-lg border ${
            step === "waiting" ? "border-primary bg-primary/5" : "border-green-500 bg-green-500/5"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === "waiting" ? "bg-primary text-primary-foreground" :
              "bg-green-500 text-white"
            }`}>
              {step === "waiting" ? "1" : <CheckCircle2 className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Install Extension</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {step === "waiting"
                  ? "Download and install the Chrome extension, then refresh this page"
                  : "Extension connected!"
                }
              </p>
              {step === "waiting" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-2"
                  onClick={handleDownloadExtension}
                >
                  <Download className="h-4 w-4" />
                  Download Extension
                </Button>
              )}
            </div>
            {step === "waiting" && isPolling && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Step 2: X Login */}
          <div className={`flex items-start gap-4 p-4 rounded-lg border ${
            step === "x_login_needed" ? "border-primary bg-primary/5" :
            ["connecting", "connected"].includes(step) ? "border-green-500 bg-green-500/5" :
            "border-muted opacity-50"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === "x_login_needed" ? "bg-primary text-primary-foreground" :
              ["connecting", "connected"].includes(step) ? "bg-green-500 text-white" :
              "bg-muted text-muted-foreground"
            }`}>
              {["connecting", "connected"].includes(step) ? <CheckCircle2 className="h-5 w-5" /> : "2"}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Log into X</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {step === "x_login_needed"
                  ? "Open X.com and make sure you're logged in"
                  : ["connecting", "connected"].includes(step)
                    ? `Logged in as @${username}`
                    : "We'll detect your X session automatically"
                }
              </p>
              {step === "x_login_needed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-2"
                  onClick={handleOpenX}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open X.com
                </Button>
              )}
            </div>
            {step === "x_login_needed" && isPolling && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Step 3: Connected */}
          <div className={`flex items-start gap-4 p-4 rounded-lg border ${
            step === "connecting" ? "border-primary bg-primary/5" :
            step === "connected" ? "border-green-500 bg-green-500/5" :
            "border-muted opacity-50"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === "connecting" ? "bg-primary text-primary-foreground" :
              step === "connected" ? "bg-green-500 text-white" :
              "bg-muted text-muted-foreground"
            }`}>
              {step === "connected" ? <CheckCircle2 className="h-5 w-5" /> : "3"}
            </div>
            <div className="flex-1">
              <h4 className="font-medium">
                {step === "connecting" ? "Connecting..." :
                 step === "connected" ? "Connected!" : "Ready to Go"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {step === "connecting"
                  ? "Setting up your session..."
                  : step === "connected"
                    ? "Your X account is connected and ready!"
                    : "Session will be synced automatically"
                }
              </p>
            </div>
            {step === "connecting" && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>

          {/* Error state */}
          {step === "error" && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive bg-destructive/5">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">Connection Error</h4>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-2"
                  onClick={() => {
                    setStep("waiting");
                    startPolling();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Status message */}
          {isPolling && step !== "connected" && (
            <p className="text-xs text-center text-muted-foreground">
              Checking for connection... This will update automatically.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
