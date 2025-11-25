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
  const rfbRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    const initVNC = async () => {
      try {
        // Dynamically import RFB only on the client side
        // @ts-expect-error - novnc-next doesn't have type declarations
        const { default: RFB } = await import('novnc-next');

        if (!mounted || !containerRef.current) return;

        console.log('🔌 Connecting to VNC session...');

        // Create RFB instance
        const rfb = new RFB(containerRef.current, url, {
          credentials: { password: "" },
        });

        rfbRef.current = rfb;

        // Event handlers
        rfb.addEventListener("connect", () => {
          console.log("✅ VNC connected");
          if (mounted) {
            setStatus("connected");
            onConnect?.();
          }
        });

        rfb.addEventListener("disconnect", () => {
          console.log("🔌 VNC disconnected");
          if (mounted) {
            setStatus("error");
            setError("Disconnected from VNC server");
            onDisconnect?.();
          }
        });

        rfb.addEventListener("securityfailure", (e: any) => {
          console.error("❌ VNC security failure:", e);
          if (mounted) {
            setStatus("error");
            setError("Security failure");
          }
        });

        // Configure VNC for maximum quality
        rfb.scaleViewport = true;
        rfb.resizeSession = false;

        // Maximum image quality settings
        rfb.qualityLevel = 9;
        rfb.compressionLevel = 0;

        // Interactive settings
        rfb.viewOnly = false;
        rfb.focusOnClick = true;

        console.log("✅ VNC configured: Quality=9, Compression=0, Interactive");

      } catch (err: any) {
        console.error("❌ Failed to initialize VNC:", err);
        if (mounted) {
          setStatus("error");
          setError(err.message || "Failed to connect to VNC server");
        }
      }
    };

    initVNC();

    return () => {
      mounted = false;
      if (rfbRef.current) {
        try {
          rfbRef.current.disconnect();
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
                <p className="text-white font-medium">Connecting to your browser session...</p>
                <p className="text-sm text-gray-400">Establishing secure connection...</p>
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
