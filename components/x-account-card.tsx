"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ConnectExtensionDialog } from "@/components/connect-extension-dialog";

interface XAccountCardProps {
  onConnectionChange?: (isConnected: boolean, username: string) => void;
}

export function XAccountCard({ onConnectionChange }: XAccountCardProps = {}) {
  const { user } = useUser(); // Get authenticated user
  const { getToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check connection status on mount and when user changes
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        // First, check localStorage for cached data
        const cachedUsername = localStorage.getItem(`x_username_${user.id}`);
        const cachedConnected = localStorage.getItem(`x_connected_${user.id}`);
        
        if (cachedUsername && cachedConnected === 'true') {
          console.log('✅ Using cached connection:', cachedUsername);
          setUsername(cachedUsername);
          setIsConnected(true);
          
          // Notify parent component
          if (onConnectionChange) {
            onConnectionChange(true, cachedUsername);
          }
        }

        // Then verify with backend (but don't clear cache if it fails)
        const token = await getToken();
        if (!token) {
          console.error("No auth token available");
          setIsChecking(false);
          return;
        }

        const extensionUrl = process.env.NEXT_PUBLIC_EXTENSION_BACKEND_URL || 'http://localhost:8001';
        // Pass user_id to only get THIS user's data (security fix)
        const response = await fetch(`${extensionUrl}/api/extension/status?user_id=${user.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await response.json();

        console.log('📡 Extension backend status:', data);

        // Find THIS user's data (should be the only one returned now)
        // Accept both 'users' and 'users_with_info' field names for compatibility
        const usersList = data.users_with_info || data.users || [];
        const userData = usersList.find((u: any) => u.hasCookies && u.username && u.userId === user.id);
        
        if (userData && userData.username) {
          console.log('✅ Backend confirmed X account:', userData.username);
          setUsername(userData.username);
          setIsConnected(true);
          // Update localStorage
          localStorage.setItem(`x_username_${user.id}`, userData.username);
          localStorage.setItem(`x_connected_${user.id}`, 'true');
          
          // Notify parent component
          if (onConnectionChange) {
            onConnectionChange(true, userData.username);
          }
        } else if (!cachedUsername) {
          // Only clear if we also don't have cache
          console.log('❌ No connected X account found and no cache');
          setIsConnected(false);
          setUsername('');
          
          // Notify parent component
          if (onConnectionChange) {
            onConnectionChange(false, '');
          }
        } else {
          console.log('⚠️ Backend check failed but keeping cached connection');
        }
      } catch (error) {
        console.error('Failed to check connection status:', error);
        // Keep cached data if backend check fails
      } finally {
        setIsChecking(false);
      }
    };

    checkConnectionStatus();
  }, [user?.id]);

  return (
    <>
      <Card className={`transition-all duration-500 ${
        isConnected ? 'h-auto' : 'animate-in fade-in slide-in-from-top duration-700'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`transition-all duration-300 ${
                isConnected ? 'text-base' : 'text-xl'
              }`}>
                {isConnected ? '✅ X Account Connected' : 'Connect Your X Account'}
              </CardTitle>
              {!isConnected && (
                <CardDescription className="animate-in fade-in duration-500 delay-100">
                  Connect your X account to start automating
                </CardDescription>
              )}
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
          ) : isConnected ? (
            <div className="animate-in fade-in zoom-in duration-500">
              <p className="text-sm text-muted-foreground">
                Your account <span className="font-semibold text-foreground">@{username}</span> is connected and ready! 
                This card will minimize in a moment...
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
              <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your X account to start automating likes, follows, and comments.
                  You'll log in through a secure browser - we never see your password!
                </p>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowConnectDialog(true)}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Connect X Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectExtensionDialog 
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        userId={user?.id || ''}
        onSuccess={(username) => {
          setUsername(username);
          setIsConnected(true);
          setShowConnectDialog(false);
          // Save to localStorage
          if (user?.id) {
            localStorage.setItem(`x_username_${user.id}`, username);
            localStorage.setItem(`x_connected_${user.id}`, 'true');
          }
          // Notify parent component
          onConnectionChange?.(true, username);
        }}
      />
    </>
  );
}

