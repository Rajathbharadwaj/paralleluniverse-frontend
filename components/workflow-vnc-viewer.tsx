"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { VNCViewer } from '@/components/vnc-viewer';
import { VNC_BROWSER_URL } from '@/lib/config';

interface WorkflowVNCViewerProps {
  isExecuting?: boolean;
}

export function WorkflowVNCViewer({ isExecuting = false }: WorkflowVNCViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vncConnected, setVncConnected] = useState(false);

  return (
    <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : ''} flex flex-col border-0 rounded-none shadow-none`}>
      <CardHeader className="border-b py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5" />
            <CardTitle className="text-base">Agent Browser</CardTitle>
            {isExecuting && (
              <Badge variant="default" className="text-xs">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                Live
              </Badge>
            )}
            {vncConnected && (
              <Badge variant="secondary" className="text-xs">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                Connected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              VNC: Cloud
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(!isFullscreen);
              }}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className={`p-0 bg-black ${isFullscreen ? 'flex-1' : ''}`}>
          <div className={`relative ${isFullscreen ? 'h-full' : 'h-[280px]'}`}>
            <VNCViewer
              url={VNC_BROWSER_URL}
              onConnect={() => setVncConnected(true)}
              onDisconnect={() => setVncConnected(false)}
            />

            {/* Quick Instructions */}
            {!isExecuting && !vncConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                <div className="bg-card/95 p-6 rounded-lg text-center max-w-md pointer-events-auto">
                  <Monitor className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Agent Browser View</h3>
                  <p className="text-sm text-muted-foreground">
                    Click <strong>Execute</strong> to start the workflow.
                    Watch the agent navigate and interact with X in real-time.
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Connected to the same browser with your X.com cookies
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}

      {isCollapsed && (
        <div className="p-3 text-center text-xs text-muted-foreground bg-muted/30">
          <span className="flex items-center justify-center gap-2">
            <Monitor className="w-3 h-3" />
            Agent Browser - Click header to expand
          </span>
        </div>
      )}
    </Card>
  );
}
