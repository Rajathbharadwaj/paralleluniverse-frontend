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
import { Loader2, CheckCircle2, Download, Chrome } from "lucide-react";

interface ConnectExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: (username: string) => void;
}

export function ConnectExtensionDialog({ open, onOpenChange, userId, onSuccess }: ConnectExtensionDialogProps) {
  const [step, setStep] = useState<"install" | "checking" | "connected" | "error">("install");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      checkExtensionStatus();
    }
  }, [open]);

  const checkExtensionStatus = async () => {
    setStep("checking");
    
    try {
      // Call extension backend directly to get user with cookies
      const response = await fetch('http://localhost:8001/status');
      const data = await response.json();
      
      if (data.users_with_info && data.users_with_info.length > 0) {
        // Find the first user that actually has cookies
        const user = data.users_with_info.find((u: any) => u.hasCookies && u.username);
        
        if (!user) {
          setStep("install");
          setError("Extension connected but no X account logged in. Please log into X.com in your browser.");
          return;
        }
        
        const detectedUsername = user.username || user.userId;
        const userId = user.userId;
        
        setUsername(detectedUsername);
        
        // User has cookies! Inject them into Docker
        console.log('🍪 User has cookies, injecting into Docker...', userId);
        
        try {
          const injectResponse = await fetch('http://localhost:8002/api/inject-cookies-to-docker', {
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
            console.log('⚠️ Session injection failed:', injectResult.error);
            setError(`Cookie injection failed: ${injectResult.error || 'Unknown error'}`);
            setStep("error");
          }
        } catch (injectErr) {
          console.error('Failed to inject cookies:', injectErr);
          setError('Failed to inject cookies into Docker browser');
          setStep("error");
        }
      } else {
        // Not connected yet or no cookies
        setStep("install");
        setError("Extension not detected or no X account logged in. Make sure you're logged into X and the extension is installed.");
      }
    } catch (err) {
      console.error('Failed to check extension status:', err);
      setStep("install");
      setError("Could not connect to backend. Make sure the server is running.");
    }
  };

  const handleInstallClick = () => {
    // In production, this would open Chrome Web Store
    // For now, show instructions
    alert("Extension installation:\n\n1. Download extension folder\n2. Go to chrome://extensions/\n3. Enable Developer Mode\n4. Click 'Load unpacked'\n5. Select extension folder");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Your X Account</DialogTitle>
          <DialogDescription>
            Install our Chrome extension to automate your X account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === "install" && (
            <>
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Chrome className="h-12 w-12 text-primary" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Install Chrome Extension</h3>
                  <p className="text-muted-foreground max-w-md">
                    Our extension runs in your browser and connects to your dashboard.
                    You stay logged into X - no password sharing needed!
                  </p>
                </div>

                <div className="w-full max-w-md space-y-3 text-sm">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <span className="font-bold text-primary">1.</span>
                    <p>Install the extension from Chrome Web Store</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <span className="font-bold text-primary">2.</span>
                    <p>Make sure you're logged into X in your browser</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <span className="font-bold text-primary">3.</span>
                    <p>Extension will auto-connect to this dashboard</p>
                  </div>
                </div>

                <Button size="lg" onClick={handleInstallClick} className="gap-2">
                  <Download className="h-5 w-5" />
                  Install Extension
                </Button>

                <p className="text-xs text-muted-foreground text-center max-w-md">
                  🔒 <strong>Privacy:</strong> The extension only works on x.com and twitter.com.
                  We never see your password - you're already logged in!
                </p>
              </div>
            </>
          )}

          {step === "checking" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Checking for extension...
              </p>
            </div>
          )}

          {step === "connected" && (
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

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-destructive">Connection Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={checkExtensionStatus}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {step === "install" && (
          <div className="border-t pt-4">
            <Button 
              variant="outline" 
              onClick={checkExtensionStatus}
              className="w-full"
            >
              I've Installed the Extension
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

