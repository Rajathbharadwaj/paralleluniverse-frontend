'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  subscribe: (callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  isConnected: false,
  subscribe: () => () => {},
});

export function WebSocketProvider({ 
  children, 
  userId 
}: { 
  children: React.ReactNode;
  userId: string | null;
}) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const subscribersRef = useRef<Set<(data: any) => void>>(new Set());

  useEffect(() => {
    if (!userId) return;

    console.log('🔌 Creating shared WebSocket connection for user:', userId);
    const wsUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8002';
    const websocket = new WebSocket(`${wsUrl}/ws/extension/${userId}`);

    websocket.onopen = () => {
      console.log('✅ Shared WebSocket connected');
      setWs(websocket);
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      // Ignore keepalive messages
      if (event.data === "keepalive") {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        console.log('📨 Shared WebSocket received:', data);

        // Notify all subscribers
        subscribersRef.current.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Error in WebSocket subscriber:', error);
          }
        });
      } catch (error) {
        console.error('Failed to parse WebSocket message:', event.data, error);
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ Shared WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('🔌 Shared WebSocket closed');
      setWs(null);
      setIsConnected(false);
    };

    return () => {
      console.log('🧹 Cleaning up shared WebSocket...');
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [userId]);

  const subscribe = (callback: (data: any) => void) => {
    subscribersRef.current.add(callback);
    console.log(`📡 Subscriber added (total: ${subscribersRef.current.size})`);
    
    return () => {
      subscribersRef.current.delete(callback);
      console.log(`📡 Subscriber removed (total: ${subscribersRef.current.size})`);
    };
  };

  return (
    <WebSocketContext.Provider value={{ ws, isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}

