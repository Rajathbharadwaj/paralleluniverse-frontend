"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Terminal, Loader2, CircleCheckBigIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToolCallBoxProps {
  toolName: string;
  status: "pending" | "completed";
  toolInput?: any;
}

export const WorkflowToolCallBox = React.memo<ToolCallBoxProps>(
  ({ toolName, status, toolInput }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const displayName = toolName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    const statusIcon = status === "completed" ? (
      <CircleCheckBigIcon size={14} className="text-green-500" />
    ) : (
      <Loader2 size={14} className="animate-spin text-blue-500" />
    );

    const hasContent = toolInput && Object.keys(toolInput).length > 0;

    return (
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border-none shadow-none outline-none transition-colors duration-200 hover:bg-accent",
          isExpanded && hasContent && "bg-accent"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex w-full items-center justify-between gap-2 border-none px-2 py-1 text-left shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-default"
          )}
          disabled={!hasContent}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {statusIcon}
              <span className="text-sm font-medium text-foreground">
                {displayName}
              </span>
            </div>
            {hasContent &&
              (isExpanded ? (
                <ChevronUp size={14} className="shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
              ))}
          </div>
        </Button>

        {isExpanded && hasContent && (
          <div className="px-4 pb-3">
            <div className="mt-2">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Arguments
              </h4>
              <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-all rounded-sm border border-border bg-muted/40 p-2 font-mono text-xs leading-6 text-foreground">
                {JSON.stringify(toolInput, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  }
);

WorkflowToolCallBox.displayName = "WorkflowToolCallBox";
