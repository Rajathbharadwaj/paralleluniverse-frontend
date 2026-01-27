"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Linkedin, Unlink } from "lucide-react";
import { LinkedInConnectDialog } from "./LinkedInConnectDialog";
import { fetchLinkedInAccounts, disconnectLinkedInAccount, LinkedInAccount } from "@/lib/api/linkedin";

interface LinkedInAccountCardProps {
  onConnectionChange?: (isConnected: boolean, username: string) => void;
}

export function LinkedInAccountCard({ onConnectionChange }: LinkedInAccountCardProps = {}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = accounts.length > 0 && accounts.some(a => a.is_connected);
  const primaryAccount = accounts.find(a => a.is_connected);

  // Check connection status on mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        // Check localStorage for cached data
        const cachedUsername = localStorage.getItem(`linkedin_username_${user.id}`);
        const cachedConnected = localStorage.getItem(`linkedin_connected_${user.id}`);

        if (cachedUsername && cachedConnected === "true") {
          console.log("Using cached LinkedIn connection:", cachedUsername);
          // Create a mock account from cache while we verify
          setAccounts([{
            id: 0,
            username: cachedUsername,
            display_name: cachedUsername,
            headline: null,
            profile_url: null,
            profile_image_url: null,
            connections_count: null,
            is_connected: true,
            last_synced_at: null,
            created_at: null,
          }]);
          onConnectionChange?.(true, cachedUsername);
        }

        // Verify with backend
        const token = await getToken();
        if (token) {
          const fetchedAccounts = await fetchLinkedInAccounts(token);
          setAccounts(fetchedAccounts);

          if (fetchedAccounts.length > 0) {
            const connected = fetchedAccounts.find(a => a.is_connected);
            if (connected) {
              localStorage.setItem(`linkedin_username_${user.id}`, connected.username || "");
              localStorage.setItem(`linkedin_connected_${user.id}`, "true");
              onConnectionChange?.(true, connected.username || "");
            }
          } else if (!cachedUsername) {
            onConnectionChange?.(false, "");
          }
        }
      } catch (error) {
        console.error("Failed to check LinkedIn connection:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnectionStatus();
  }, [user?.id, getToken, onConnectionChange]);

  const handleDisconnect = async (accountId: number) => {
    if (!user?.id) return;

    setIsDisconnecting(true);
    try {
      const token = await getToken();
      if (token) {
        await disconnectLinkedInAccount(accountId, token);
        setAccounts(accounts.filter(a => a.id !== accountId));
        localStorage.removeItem(`linkedin_username_${user.id}`);
        localStorage.removeItem(`linkedin_connected_${user.id}`);
        onConnectionChange?.(false, "");
      }
    } catch (error) {
      console.error("Failed to disconnect LinkedIn:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnectSuccess = (username: string) => {
    if (user?.id) {
      localStorage.setItem(`linkedin_username_${user.id}`, username);
      localStorage.setItem(`linkedin_connected_${user.id}`, "true");
    }
    setAccounts([{
      id: Date.now(), // Temporary ID
      username,
      display_name: username,
      headline: null,
      profile_url: null,
      profile_image_url: null,
      connections_count: null,
      is_connected: true,
      last_synced_at: null,
      created_at: null,
    }]);
    setShowConnectDialog(false);
    onConnectionChange?.(true, username);
  };

  return (
    <>
      <Card
        className={`transition-all duration-500 ${
          isConnected ? "h-auto" : "animate-in fade-in slide-in-from-top duration-700"
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-[#0A66C2]" />
              <div>
                <CardTitle
                  className={`transition-all duration-300 ${
                    isConnected ? "text-base" : "text-xl"
                  }`}
                >
                  {isConnected ? "LinkedIn Connected" : "Connect Your LinkedIn Account"}
                </CardTitle>
                {!isConnected && (
                  <CardDescription className="animate-in fade-in duration-500 delay-100">
                    Connect your LinkedIn account to start professional automation
                  </CardDescription>
                )}
              </div>
            </div>
            {!isConnected && (
              <Badge variant="secondary" className="gap-1 animate-pulse">
                <XCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Checking connection...</span>
            </div>
          ) : isConnected && primaryAccount ? (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {primaryAccount.profile_image_url ? (
                    <img
                      src={primaryAccount.profile_image_url}
                      alt={primaryAccount.display_name || "Profile"}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold">
                      {(primaryAccount.display_name || primaryAccount.username || "L")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">
                      {primaryAccount.display_name || primaryAccount.username}
                    </p>
                    {primaryAccount.headline && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {primaryAccount.headline}
                      </p>
                    )}
                    {primaryAccount.connections_count && (
                      <p className="text-xs text-muted-foreground">
                        {primaryAccount.connections_count.toLocaleString()} connections
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(primaryAccount.id)}
                  disabled={isDisconnecting}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
              <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your LinkedIn account to automate professional engagement.
                  You'll log in through a secure browser - we never see your password!
                </p>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowConnectDialog(true)}
                >
                  <Linkedin className="h-5 w-5 mr-2" />
                  Connect LinkedIn
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LinkedInConnectDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        userId={user?.id || ""}
        onSuccess={handleConnectSuccess}
      />
    </>
  );
}
