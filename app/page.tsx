"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { fetchExtension, fetchBackendAuth } from "@/lib/api-client";
import { DashboardHeader } from "@/components/dashboard-header";
import { XAccountCard } from "@/components/x-account-card";
import { ImportPostsCard } from "@/components/import-posts-card";
import { DeepAgentChat } from "@/components/deep-agent-chat";
import { AutomationControls } from "@/components/automation-controls";
import { RecentActivityLive } from "@/components/recent-activity-live";
import { AgentBrowserViewer } from "@/components/agent-browser-viewer";
import { SetupStatusBar } from "@/components/setup-status-bar";
import { ResizableSidebar } from "@/components/resizable-sidebar";
import { PreviewStyleCard } from "@/components/preview-style-card";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { OnboardingPreferencesWizard } from "@/components/onboarding-preferences-wizard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { WebSocketProvider } from "@/contexts/websocket-context";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePreferences } from "@/hooks/usePreferences";
import { useSubscription } from "@/hooks/useSubscription";

export default function DashboardPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding();
  const { data: preferencesData, mutate: mutatePreferences } = usePreferences();
  const { data: subscription } = useSubscription();
  const [showPreferencesWizard, setShowPreferencesWizard] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [postsImported, setPostsImported] = useState(0);
  const [showSetupCards, setShowSetupCards] = useState(true);
  const [manuallyOpened, setManuallyOpened] = useState(false); // Track if user manually opened setup
  const minimizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if preferences wizard should be shown (BEFORE feature tour)
  useEffect(() => {
    // Only show if:
    // 1. User has active subscription
    // 2. Preferences onboarding not completed
    // 3. Preferences data is loaded
    if (
      subscription?.has_subscription &&
      preferencesData?.preferences &&
      preferencesData.preferences.preferences_onboarding_completed !== true
    ) {
      setShowPreferencesWizard(true);
    } else {
      setShowPreferencesWizard(false);
    }
  }, [subscription?.has_subscription, preferencesData?.preferences]);

  // Handle preferences wizard completion
  const handlePreferencesComplete = async () => {
    setShowPreferencesWizard(false);
    // Refresh preferences to update the state
    await mutatePreferences();
  };

  // Add Clerk user ID to page for extension to read
  useEffect(() => {
    if (user?.id) {
      // Add meta tag with Clerk user ID for extension
      let metaTag = document.querySelector('meta[name="clerk-user-id"]') as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'clerk-user-id';
        document.head.appendChild(metaTag);
      }
      metaTag.content = user.id;
      console.log('✅ Added Clerk user ID to page meta tag:', user.id);
    }
  }, [user?.id]);

  // Send Clerk user ID to extension on page load (fallback method)
  // Primary method is via content script reading clerk-user-id meta tag
  useEffect(() => {
    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
    if (!user?.id || !extensionId || extensionId === 'your-extension-id') {
      // No valid extension ID configured - rely on content script method instead
      return;
    }

    try {
      (window as any).chrome?.runtime?.sendMessage(
        extensionId,
        {
          type: 'CONNECT_WITH_USER_ID',
          userId: user.id
        },
        () => {
          if ((window as any).chrome?.runtime?.lastError) {
            console.log('Extension not installed:', (window as any).chrome.runtime.lastError);
          } else {
            console.log('✅ Sent Clerk user ID to extension on page load:', user.id);
          }
        }
      );
    } catch {
      // Silently fail - content script method will handle this
    }
  }, [user?.id]);

  // Auto-inject cookies to VNC on page load
  useEffect(() => {
    const autoInjectCookies = async () => {
      if (!user?.id) return;
      
      // Check if we've already auto-injected in this session
      const sessionKey = `vnc_auto_injected_${user.id}`;
      const alreadyInjected = sessionStorage.getItem(sessionKey);
      
      if (alreadyInjected) {
        console.log('✅ Already auto-injected cookies in this session');
        return;
      }
      
      try {
        // Check if user has cookies - pass user ID to filter to only this user's data
        const statusResponse = await fetchExtension(`/status?user_id=${user.id}`);
        const statusData = await statusResponse.json();

        // Should only have this user's data now, but still check
        // Accept both 'users' and 'users_with_info' field names for compatibility
        const usersList = statusData.users_with_info || statusData.users || [];
        const connectedUser = usersList.find((u: any) => u.hasCookies && u.username && u.userId === user.id);
        
        if (connectedUser) {
          console.log('🔄 Auto-injecting cookies to VNC for @' + connectedUser.username);

          const token = await getToken();
          if (!token) {
            console.log('⚠️ No auth token available for auto-inject');
            return;
          }

          const response = await fetchBackendAuth('/api/inject-cookies-to-docker', token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: connectedUser.userId })
          });

          const data = await response.json();

          if (data.success) {
            console.log('✅ Auto-injected cookies to VNC successfully');
            sessionStorage.setItem(sessionKey, 'true');
          } else {
            console.log('⚠️ Auto-inject failed:', data.error);
          }
        }
      } catch (error) {
        console.error('❌ Auto-inject error:', error);
      }
    };
    
    // Run after a short delay to ensure backend is ready
    const timer = setTimeout(autoInjectCookies, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, getToken]);

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
          // Pass user_id to only get THIS user's data (security fix)
          const response = await fetchExtension(`/status?user_id=${user.id}`);
          const data = await response.json();

          console.log('📡 Backend status:', data);

          // Find this user's data (should be the only one returned now)
          // Accept both 'users' and 'users_with_info' field names for compatibility
          const usersList = data.users_with_info || data.users || [];
          const userData = usersList.find((u: any) => u.hasCookies && u.username && u.userId === user.id);
          
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

      // Load posts count from database (more reliable than localStorage)
      if (cachedUsername) {
        try {
          const token = await getToken();
          if (!token) {
            console.error('No auth token available');
            return;
          }
          const countResponse = await fetchBackendAuth(`/api/posts/count/${cachedUsername}`, token);
          const countData = await countResponse.json();
          
          if (countData.success && countData.count > 0) {
            console.log(`📊 Loaded ${countData.count} posts from database for parent component`);
            setPostsImported(countData.count);
            
            // Update localStorage with correct count
            localStorage.setItem(`import_result_${user.id}`, JSON.stringify({
              imported: countData.count,
              total: countData.count,
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('Failed to fetch posts count:', error);
          
          // Fallback to localStorage if database fetch fails
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
        }
      }
    };

    checkStatus();
  }, [user?.id, postsImported]);

  // Auto-minimize setup cards when both connection and import are complete
  // BUT only if user didn't manually open them
  useEffect(() => {
    console.log('🔍 Auto-minimize check:', {
      userId: user?.id,
      manuallyOpened,
      isConnected,
      username,
      postsImported,
      showSetupCards
    });
    
    if (!user?.id || manuallyOpened) {
      console.log('⏸️ Auto-minimize blocked:', !user?.id ? 'No user ID' : 'Manually opened');
      return;
    }
    
    const hasConnection = isConnected && username;
    const hasImport = postsImported > 0;
    
    console.log('🔍 Conditions:', { hasConnection, hasImport, showSetupCards });
    
    if (hasConnection && hasImport && showSetupCards) {
      // Clear any existing timer
      if (minimizeTimerRef.current) {
        console.log('⏱️ Clearing existing timer');
        clearTimeout(minimizeTimerRef.current);
      }
      
      console.log('✅ Both setup tasks complete, auto-minimizing in 3s...');
      minimizeTimerRef.current = setTimeout(() => {
        setShowSetupCards(false);
        console.log('✅ Setup cards minimized');
        minimizeTimerRef.current = null;
      }, 3000);
    }
    
    // Don't cleanup the timer on re-render - let it complete
    return () => {
      // Only cleanup if we're unmounting completely
    };
  }, [isConnected, username, postsImported, showSetupCards, manuallyOpened, user?.id]);

  const handleDisconnect = async () => {
    if (user?.id) {
      // Clear localStorage immediately for responsive UI
      localStorage.removeItem(`x_username_${user.id}`);
      localStorage.removeItem(`x_connected_${user.id}`);

      // Update UI state immediately
      setIsConnected(false);
      setUsername("");
      setShowSetupCards(true);

      // Call backend to clear cookies from extension backend (database + memory)
      try {
        const response = await fetchExtension(`/disconnect/${user.id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          console.log('✅ Successfully disconnected from backend:', result);
        } else {
          console.log('⚠️ Backend disconnect returned:', result);
        }
      } catch (error) {
        console.log('Could not disconnect from backend:', error);
      }
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

        {/* Preferences Wizard - shows FIRST after subscription (before feature tour) */}
        <OnboardingPreferencesWizard
          open={showPreferencesWizard}
          onComplete={handlePreferencesComplete}
        />

        {/* Feature Tour - shows AFTER preferences wizard is complete */}
        <OnboardingWizard
          open={!showPreferencesWizard && shouldShowOnboarding}
          onComplete={completeOnboarding}
        />

      <main className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column - Main Content (scrollable) */}
        <div className="flex-1 overflow-y-auto h-full">
          <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
            {/* Status Bar - ALWAYS show when connected */}
            {isConnected && (
              <SetupStatusBar
                isConnected={isConnected}
                username={username}
                postsImported={postsImported}
                onDisconnect={handleDisconnect}
                onSync={handleSync}
              />
            )}

            {/* X Account Card - Show during initial setup (not connected yet) */}
            {!isConnected && (
              <XAccountCard 
                onConnectionChange={(connected, user) => {
                  console.log('🔔 Connection changed:', connected, user);
                  setIsConnected(connected);
                  setUsername(user);
                }}
              />
            )}
            
            {/* Import Posts Card - Show when connected AND (first time OR manually opened) */}
            {isConnected && showSetupCards && (
              <ImportPostsCard 
                onImportComplete={(count) => {
                  console.log(`📊 onImportComplete called with count: ${count}, current: ${postsImported}`);
                  
                  // Only reset manuallyOpened if NEW posts were imported (count increased)
                  if (count > postsImported) {
                    console.log(`📊 New posts imported! Allowing auto-minimize`);
                    setPostsImported(count);
                    setManuallyOpened(false); // Allow auto-minimize for new imports
                  } else {
                    console.log(`📊 No new posts, keeping manuallyOpened state`);
                    setPostsImported(count);
                    // Don't change manuallyOpened - keep it as is
                  }
                }}
              />
            )}
            
            {/* Preview Style Card - Show when connected (posts already in DB) */}
            {isConnected && <PreviewStyleCard />}
            
            {/* Agent Browser Viewer (VNC) */}
            <AgentBrowserViewer />
            
            {/* Recent Activity */}
            <RecentActivityLive />
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
              <DeepAgentChat />
            </div>
          </ResizableSidebar>
        </div>
      </main>
    </div>
    </WebSocketProvider>
  );
}
