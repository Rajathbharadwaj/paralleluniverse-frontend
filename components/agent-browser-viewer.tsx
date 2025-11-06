"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Monitor, Maximize2, Minimize2 } from "lucide-react";
import { VNCViewer } from "@/components/vnc-viewer";

export function AgentBrowserViewer() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when fullscreen
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Agent Browser</CardTitle>
              <CardDescription>
                Watch your AI agent work in real-time
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Docker Running
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Browser
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Browser
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent>
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    🤖 This is your AI agent's browser
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your LangGraph agent controls this Docker browser using your X session cookies.
                    Watch it navigate, like posts, follow users, and more - all automatically!
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* VNC Viewer - Normal Size */}
            {!isFullscreen && (
              <div 
                className="border rounded-lg overflow-hidden bg-black relative"
                style={{ height: "600px" }}
              >
                <VNCViewer url="ws://localhost:5900" />
              </div>
            )}

            {/* Connection Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>🔗 VNC: localhost:5900</span>
                <span>🐳 Docker: localhost:8005</span>
              </div>
              <span className="text-xs">
                Tip: The agent uses this browser to automate your X account
              </span>
            </div>
          </div>
        </CardContent>
      )}

      {/* Fullscreen VNC Viewer - Rendered outside card */}
      {isFullscreen && (
        <>
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-black/90 z-[100]"
            onClick={() => setIsFullscreen(false)}
          />
          
          {/* Fullscreen VNC Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="w-full h-full bg-black rounded-lg overflow-hidden relative shadow-2xl">
              {/* Floating Controls */}
              <div className="absolute top-4 right-4 z-[102] flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                  className="shadow-lg"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
                <div className="text-xs text-white/60 flex items-center bg-black/50 px-3 rounded">
                  Press ESC to exit
                </div>
              </div>
              
              <VNCViewer url="ws://localhost:5900" />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

