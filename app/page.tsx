"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { DashboardHeader } from "@/components/dashboard-header";
import { XAccountCard } from "@/components/x-account-card";
import { ImportPostsCard } from "@/components/import-posts-card";
import { AgentControlCard } from "@/components/agent-control-card";
import { AutomationControls } from "@/components/automation-controls";
import { RecentActivity } from "@/components/recent-activity";
import { AgentBrowserViewer } from "@/components/agent-browser-viewer";
import { SetupStatusBar } from "@/components/setup-status-bar";
import { ResizableSidebar } from "@/components/resizable-sidebar";
import { PreviewStyleCard } from "@/components/preview-style-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { WebSocketProvider } from "@/contexts/websocket-context";

export default function DashboardPage() {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [postsImported, setPostsImported] = useState(0);
  const [showSetupCards, setShowSetupCards] = useState(true);
  const [manuallyOpened, setManuallyOpened] = useState(false); // Track if user manually opened setup

  // Check setup status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) {
        console.log('⚠️ No user ID yet');
        return;
      }

      const cachedUsername = localStorage.getItem(`x_username_${user.id}`);
      const cachedConnected = localStorage.getItem(`x_connected_${user.id}`);
      const cachedImport = localStorage.getItem(`import_result_${user.id}`);

      console.log('🔍 Dashboard state check:', {
        userId: user.id,
        cachedUsername,
        cachedConnected,
        cachedImport,
        currentIsConnected: isConnected
      });

      if (cachedUsername && cachedConnected === 'true') {
        setIsConnected(true);
        setUsername(cachedUsername);
        console.log('✅ Set isConnected to true from localStorage');
      } else {
        // If no cache, check backend
        try {
          console.log('🔍 No cache found, checking backend...');
          const response = await fetch('http://localhost:8001/status');
          const data = await response.json();
          
          console.log('📡 Backend status:', data);
          
          // Find ANY user with cookies and username (extension user, not Clerk user)
          const userData = data.users_with_info?.find((u: any) => u.hasCookies && u.username);
          
          console.log('🔍 Found user data:', userData);
          
          if (userData && userData.username) {
            console.log('✅ Found connection in backend:', userData.username);
            setIsConnected(true);
            setUsername(userData.username);
            // Save to localStorage
            localStorage.setItem(`x_username_${user.id}`, userData.username);
            localStorage.setItem(`x_connected_${user.id}`, 'true');
          } else {
            console.log('❌ No connection found in backend', { userData });
          }
        } catch (error) {
          console.error('❌ Failed to check backend:', error);
        }
      }

      if (cachedImport) {
        try {
          const parsed = JSON.parse(cachedImport);
          const newImportCount = parsed.imported || 0;
          
          // If import count increased, reset manuallyOpened so auto-minimize can work
          if (newImportCount > postsImported) {
            setManuallyOpened(false);
          }
          
          setPostsImported(newImportCount);
        } catch (e) {
          console.error('Failed to parse import result:', e);
        }
      }
    };

    checkStatus();
  }, [user?.id, postsImported]);

  // Auto-minimize setup cards when both connection and import are complete
  // BUT only if user didn't manually open them
  useEffect(() => {
    if (!user?.id || manuallyOpened) return; // Don't auto-minimize if manually opened
    
    const hasConnection = isConnected && username;
    const hasImport = postsImported > 0;
    
    if (hasConnection && hasImport && showSetupCards) {
      console.log('✅ Both setup tasks complete, auto-minimizing in 3s...');
      const timer = setTimeout(() => {
        setShowSetupCards(false);
        console.log('✅ Setup cards minimized');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, username, postsImported, showSetupCards, manuallyOpened, user?.id]);

  const handleDisconnect = () => {
    if (user?.id) {
      localStorage.removeItem(`x_username_${user.id}`);
      localStorage.removeItem(`x_connected_${user.id}`);
      setIsConnected(false);
      setUsername("");
      setShowSetupCards(true);
    }
  };

  const handleSync = () => {
    // Show the import card again so user can import more posts
    setManuallyOpened(true); // Mark as manually opened to prevent auto-minimize
    setShowSetupCards(true);
  };

  return (
    <WebSocketProvider userId={user?.id || null}>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <DashboardHeader />
      
      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column - Main Content (scrollable) */}
        <div className="flex-1 overflow-y-auto h-full">
          <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
            {/* Compact Status Bar (shows when both setup tasks are complete) */}
            {!showSetupCards && (
              <SetupStatusBar
                isConnected={isConnected}
                username={username}
                postsImported={postsImported}
                onDisconnect={handleDisconnect}
                onSync={handleSync}
              />
            )}

            {/* Setup Cards - Show during setup phase */}
            {showSetupCards && !isConnected && (
              <XAccountCard 
                onConnectionChange={(connected, user) => {
                  console.log('🔔 Connection changed:', connected, user);
                  setIsConnected(connected);
                  setUsername(user);
                }}
              />
            )}
            
            {/* Import Posts Card - Show when connected and setup cards are visible */}
            {isConnected && showSetupCards && <ImportPostsCard />}
            
            {/* Minimized import status - Show when setup is complete */}
            {isConnected && !showSetupCards && postsImported > 0 && (
              <Card className="w-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Writing Style Learned</p>
                        <p className="text-xs text-muted-foreground">{postsImported} posts analyzed</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setManuallyOpened(true);
                        setShowSetupCards(true);
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Sync More Posts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Preview Style Card - Show when connected (posts already in DB) */}
            {isConnected && <PreviewStyleCard />}
            
            {/* Agent Browser Viewer (VNC) */}
            <AgentBrowserViewer />
            
            {/* Recent Activity */}
            <RecentActivity />
              </div>
            </div>

        {/* Right Column - AI Agent Control (resizable, full height) */}
        <div className="hidden lg:flex flex-col">
          <ResizableSidebar 
            defaultWidth={500} 
            minWidth={400} 
            maxWidth={800}
            side="right"
            storageKey="agent-panel-width"
          >
            <div className="h-full border-l bg-card/50">
              <AgentControlCard />
            </div>
          </ResizableSidebar>
        </div>
      </main>
    </div>
    </WebSocketProvider>
  );
}
