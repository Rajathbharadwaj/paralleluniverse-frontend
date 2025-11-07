"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, RefreshCw, X, Loader2, Monitor } from "lucide-react";

interface SetupStatusBarProps {
  isConnected: boolean;
  username: string;
  postsImported: number;
  onDisconnect: () => void;
  onSync: () => void;
}

export function SetupStatusBar({
  isConnected,
  username,
  postsImported,
  onDisconnect,
  onSync
}: SetupStatusBarProps) {
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionStatus, setInjectionStatus] = useState<string | null>(null);

  const handleInjectCookies = async () => {
    setIsInjecting(true);
    setInjectionStatus(null);
    
    try {
      // Get the user ID from localStorage (this is the extension user ID, not Clerk)
      const statusResponse = await fetch('http://localhost:8001/status');
      const statusData = await statusResponse.json();
      
      // Find the connected user (the one with cookies)
      const connectedUser = statusData.users_with_info?.find((u: any) => u.hasCookies && u.username);
      
      if (!connectedUser) {
        setInjectionStatus('❌ No X account connected');
        setIsInjecting(false);
        return;
      }
      
      const response = await fetch('http://localhost:8002/api/inject-cookies-to-docker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: connectedUser.userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInjectionStatus('✅ Cookies injected to VNC!');
        setTimeout(() => setInjectionStatus(null), 3000);
      } else {
        setInjectionStatus(`❌ ${data.error}`);
      }
    } catch (error) {
      setInjectionStatus('❌ Failed to inject cookies');
    } finally {
      setIsInjecting(false);
    }
  };

  // Don't show if nothing is set up
  if (!isConnected && postsImported === 0) {
    return null;
  }

  return (
    <div className="bg-card border rounded-lg p-3 mb-6 animate-in slide-in-from-top duration-500">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Status items */}
        <div className="flex items-center gap-4 flex-1">
          {/* X Account Status */}
          {isConnected && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">@{username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnect}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Disconnect
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInjectCookies}
                disabled={isInjecting}
                className="h-7 px-2 text-xs"
                title="Inject cookies into Docker VNC browser"
              >
                {isInjecting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Monitor className="h-3 w-3 mr-1" />
                )}
                {isInjecting ? 'Injecting...' : 'Load in VNC'}
              </Button>
              {injectionStatus && (
                <span className="text-xs text-muted-foreground">{injectionStatus}</span>
              )}
            </div>
          )}

          {/* Posts Import Status */}
          {postsImported > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300 delay-150">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{postsImported} posts imported</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSync}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync
              </Button>
            </div>
          )}
        </div>

        {/* Right side - All set badge */}
        {isConnected && postsImported > 0 && (
          <Badge variant="default" className="bg-green-500 animate-in fade-in zoom-in duration-300 delay-300">
            All Set! 🎉
          </Badge>
        )}
      </div>
    </div>
  );
}


