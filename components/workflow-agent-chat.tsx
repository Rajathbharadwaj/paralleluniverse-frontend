"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

interface WorkflowAgentChatProps {
  workflowJson: any;
}

/**
 * Embeds the Deep Agent Chat UI with a workflow JSON as the initial prompt.
 * This provides proper step tracking, tool execution visibility, and agent reasoning.
 * Thread management is handled entirely by the Deep Agent Chat UI.
 */
export function WorkflowAgentChat({
  workflowJson
}: WorkflowAgentChatProps) {
  const { userId } = useAuth();

  // Convert workflow JSON to a prompt string
  const workflowPrompt = useMemo(() => {
    if (!workflowJson) return "";

    // Create a structured prompt from the workflow
    const steps = workflowJson.steps || [];
    const stepsText = steps.map((step: any, idx: number) =>
      `${idx + 1}. ${step.description || step.action}`
    ).join('\n');

    return `Execute the following workflow:

**Workflow:** ${workflowJson.name || 'Unnamed Workflow'}

**Steps:**
${stepsText}

Please execute these steps in order and provide detailed progress updates.`;
  }, [workflowJson]);

  // Use deployed deep-agents-ui URL in production, localhost in development
  const deepAgentBaseUrl = process.env.NODE_ENV === "production"
    ? "https://deep-agents-ui-644185288504.us-central1.run.app"
    : "http://localhost:3001";

  // Build URL with parameters
  const deepAgentUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('assistantId', 'x_growth_deep_agent');

    if (userId) {
      params.set('userId', userId);
    }

    // Always pass the workflow prompt as an initial message and auto-send it
    if (workflowPrompt) {
      params.set('initialMessage', workflowPrompt);
      params.set('autoSend', 'true');  // Auto-send the workflow on load
    }

    return `${deepAgentBaseUrl}?${params.toString()}`;
  }, [userId, workflowPrompt, deepAgentBaseUrl]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <iframe
        src={deepAgentUrl}
        className="w-full h-full border-0"
        title="Workflow Execution Agent"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
