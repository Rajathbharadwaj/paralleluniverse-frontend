"use client";

import { ClientProvider } from "@/providers/ClientProvider";

export default function AutomationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get LangGraph deployment URL and API key from environment
  const deploymentUrl = process.env.NEXT_PUBLIC_LANGGRAPH_URL || "";
  const apiKey = process.env.NEXT_PUBLIC_LANGGRAPH_API_KEY || "";

  return (
    <ClientProvider deploymentUrl={deploymentUrl} apiKey={apiKey}>
      {children}
    </ClientProvider>
  );
}
