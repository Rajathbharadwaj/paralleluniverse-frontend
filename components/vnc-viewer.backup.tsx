"use client";

import { useEffect, useRef, useState } from "react";

interface VNCViewerProps {
  url: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function VNCViewer({ url, onConnect, onDisconnect }: VNCViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rfb: any;

    // Load noVNC dynamically
    const loadVNC = async () => {
      try {
        // Try to load RFB from npm package
        let RFB;
        try {
          const novncModule = await import('@novnc/novnc/core/rfb.js');
          RFB = novncModule.default;
        } catch (importError) {
          console.log('Failed to import from npm, trying CDN...', importError);

          // Fallback to window.RFB if loaded from CDN
          RFB = (window as any).RFB;
          if (!RFB) {
            throw new Error("noVNC library not available");
          }
        }

        if (!containerRef.current) return;

        // Create RFB instance
        rfb = new RFB(containerRef.current, url, {
          credentials: { password: "" },
        });

        // Event handlers
        rfb.addEventListener("connect", () => {
          console.log("VNC connected");
          setStatus("connected");
          onConnect?.();
        });

        rfb.addEventListener("disconnect", () => {
          console.log("VNC disconnected");
          setStatus("error");
          setError("Disconnected from VNC server");
          onDisconnect?.();
        });

        rfb.addEventListener("securityfailure", (e: any) => {
          console.error("VNC security failure:", e);
          setStatus("error");
          setError("Security failure");
        });

        // Configure VNC for maximum quality
        rfb.scaleViewport = true;
        rfb.resizeSession = false;
        
        // Maximum image quality settings
        rfb.qualityLevel = 9;  // Maximum quality (0-9)
        rfb.compressionLevel = 0;  // No compression
        
        // Interactive settings
        rfb.viewOnly = false;
        rfb.focusOnClick = true;
        
        // Better clipboard integration
        rfb.clipboardUp = true;
        rfb.clipboardDown = true;
        
        // Focus the VNC canvas
        rfb.focus();
        
        console.log("✅ VNC configured: Quality=9, Compression=0, Interactive");

      } catch (err) {
        console.error("Failed to load VNC:", err);
        setStatus("error");
        setError("Failed to load VNC viewer. Make sure Docker VNC is running on port 5900.");
      }
    };

    loadVNC();

    return () => {
      if (rfb) {
        try {
          rfb.disconnect();
        } catch (e) {
          console.error("Error disconnecting VNC:", e);
        }
      }
    };
  }, [url, onConnect, onDisconnect]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Status overlay */}
      {status !== "connected" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center space-y-3 p-6">
            {status === "connecting" && (
              <>
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-white font-medium">Connecting to Docker browser...</p>
                <p className="text-sm text-gray-400">VNC: {url}</p>
              </>
            )}
            {status === "error" && (
              <>
                <div className="text-red-500 text-4xl">⚠️</div>
                <p className="text-white font-medium">Connection Failed</p>
                <p className="text-sm text-gray-400">{error}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Make sure Docker container is running on port 5900
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* VNC container */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
    </div>
  );
}

