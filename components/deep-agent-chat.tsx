"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";

interface DeepAgentChatProps {
  deploymentUrl?: string;
  assistantId?: string;
}

export function DeepAgentChat({
  deploymentUrl = process.env.NEXT_PUBLIC_LANGGRAPH_URL || "http://localhost:8124",
  assistantId = "x_growth_deep_agent"
}: DeepAgentChatProps) {
  const { userId } = useAuth();

  // Use deployed deep-agents-ui URL in production, localhost in development
  const deepAgentBaseUrl = process.env.NODE_ENV === "production"
    ? "https://deep-agents-ui-644185288504.us-central1.run.app"
    : "http://localhost:3001";

  // Pass userId in URL so deep-agents-ui can forward it to LangGraph as x-user-id header
  const deepAgentUrl = `${deepAgentBaseUrl}?assistantId=${assistantId}${userId ? `&userId=${userId}` : ''}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <iframe
        src={deepAgentUrl}
        className="w-full h-full border-0"
        title="PsY Agent"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
