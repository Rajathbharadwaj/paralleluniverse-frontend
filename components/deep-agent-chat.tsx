"use client";

import React from "react";

interface DeepAgentChatProps {
  deploymentUrl?: string;
  assistantId?: string;
}

export function DeepAgentChat({
  deploymentUrl = process.env.NEXT_PUBLIC_LANGGRAPH_URL || "http://localhost:8124",
  assistantId = "x_growth_deep_agent"
}: DeepAgentChatProps) {
  // Use deployed deep-agents-ui URL in production, localhost in development
  const deepAgentBaseUrl = process.env.NODE_ENV === "production"
    ? "https://deep-agents-ui-644185288504.us-central1.run.app"
    : "http://localhost:3001";

  const deepAgentUrl = `${deepAgentBaseUrl}?assistantId=${assistantId}`;

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
