"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, Loader2, XCircle, PlayCircle, StopCircle, Check, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ExecutionLog {
  timestamp: string;
  type: 'started' | 'parsing_complete' | 'chunk' | 'completed' | 'error';
  message: string;
  data?: any;
}

interface WorkflowExecutionPanelProps {
  workflowJson: any;
  onExecutionComplete?: (result: any) => void;
  onExecutionStateChange?: (isExecuting: boolean) => void;
}

export function WorkflowExecutionPanel({ workflowJson, onExecutionComplete, onExecutionStateChange }: WorkflowExecutionPanelProps) {
  const { user } = useUser();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [humanInLoop, setHumanInLoop] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateExecutionState = (executing: boolean) => {
    setIsExecuting(executing);
    if (onExecutionStateChange) {
      onExecutionStateChange(executing);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const executeWorkflow = () => {
    updateExecutionState(true);
    setLogs([]);
    setCurrentStep(null);
    setCompletedSteps([]);

    // Connect to WebSocket for streaming execution
    const wsBaseUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://') || 'ws://localhost:8002';
    const ws = new WebSocket(`${wsBaseUrl}/api/workflow/execute/stream`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Send workflow JSON to execute with HIL setting
      ws.send(JSON.stringify({
        workflow_json: workflowJson,
        user_id: user?.id || null,  // Send Clerk user ID
        human_in_loop: humanInLoop,  // ← Send HIL toggle state
      }));

      addLog('started', 'Workflow execution started...');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);

      switch (message.type) {
        case 'started':
          setExecutionId(message.execution_id);
          addLog('started', `Execution ID: ${message.execution_id}`);
          break;

        case 'parsing_complete':
          addLog('parsing_complete', 'Workflow parsed successfully');
          break;

        case 'interrupt':
          // Workflow paused for human approval
          setPendingApproval(message.data);
          addLog('started', `⏸️ Paused for approval: ${message.data.action}`);
          break;

        case 'chunk':
          // Parse agent output to track steps
          const chunkData = message.data;
          addLog('chunk', chunkData);

          // Try to extract step information from chunk
          if (typeof chunkData === 'string') {
            // Look for step patterns like "Step 1:", "Step 2:", etc.
            const stepMatch = chunkData.match(/Step (\d+):|task\("([^"]+)"/);
            if (stepMatch) {
              const stepInfo = stepMatch[1] || stepMatch[2];
              setCurrentStep(stepInfo);
              if (!completedSteps.includes(stepInfo)) {
                setCompletedSteps(prev => [...prev, stepInfo]);
              }
            }
          }
          break;

        case 'completed':
          addLog('completed', `Workflow completed successfully!`);
          updateExecutionState(false);
          setCurrentStep(null);
          if (onExecutionComplete) {
            onExecutionComplete(message);
          }
          ws.close();
          break;

        case 'error':
          addLog('error', `Error: ${message.error}`);
          updateExecutionState(false);
          setCurrentStep(null);
          ws.close();
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addLog('error', 'WebSocket connection error');
      updateExecutionState(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      updateExecutionState(false);
      wsRef.current = null;
    };
  };

  const stopExecution = () => {
    if (wsRef.current) {
      wsRef.current.close();
      addLog('error', 'Execution stopped by user');
      updateExecutionState(false);
      setCurrentStep(null);
    }
  };

  const approveAction = () => {
    if (wsRef.current && pendingApproval) {
      wsRef.current.send(JSON.stringify({
        type: 'approval',
        approved: true,
        data: pendingApproval
      }));
      addLog('started', '✅ Action approved, resuming...');
      setPendingApproval(null);
    }
  };

  const rejectAction = () => {
    if (wsRef.current && pendingApproval) {
      wsRef.current.send(JSON.stringify({
        type: 'approval',
        approved: false,
        data: pendingApproval
      }));
      addLog('error', '❌ Action rejected');
      setPendingApproval(null);
    }
  };

  const addLog = (type: ExecutionLog['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    }]);
  };

  const getStepStatus = (stepIndex: number) => {
    const stepStr = String(stepIndex);
    if (currentStep === stepStr) {
      return 'in_progress';
    }
    if (completedSteps.includes(stepStr)) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Execution Monitor</CardTitle>
            {isExecuting && (
              <Badge variant="default" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Running
              </Badge>
            )}
            {!isExecuting && logs.length > 0 && (
              <Badge variant="secondary">
                {logs[logs.length - 1]?.type === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </>
                ) : logs[logs.length - 1]?.type === 'error' ? (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Failed
                  </>
                ) : (
                  'Idle'
                )}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="human-in-loop"
                checked={humanInLoop}
                onCheckedChange={setHumanInLoop}
                disabled={isExecuting}
              />
              <Label htmlFor="human-in-loop" className="text-xs cursor-pointer">
                Human-in-Loop
              </Label>
            </div>

            {!isExecuting ? (
              <Button onClick={executeWorkflow} size="sm">
                <PlayCircle className="w-4 h-4 mr-2" />
                Execute
              </Button>
            ) : (
              <Button onClick={stopExecution} variant="destructive" size="sm">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Approval Panel (when paused for HIL) */}
      {pendingApproval && (
        <div className="border-b bg-yellow-500/10 border-yellow-500/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                ⏸️ Action Requires Approval
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {pendingApproval.action || 'Workflow paused for your review'}
              </p>
              {pendingApproval.details && (
                <pre className="text-xs bg-muted p-2 rounded mt-2 max-h-32 overflow-auto">
                  {JSON.stringify(pendingApproval.details, null, 2)}
                </pre>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={approveAction} size="sm" variant="default">
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button onClick={rejectAction} size="sm" variant="destructive">
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        {/* Workflow Steps Progress */}
        {workflowJson?.steps && (
          <div className="border-b p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-3">Workflow Steps</h3>
            <div className="space-y-2">
              {workflowJson.steps.map((step: any, index: number) => {
                const status = getStepStatus(index + 1);
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {status === 'in_progress' && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    {status === 'pending' && (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={status === 'in_progress' ? 'font-semibold text-primary' : ''}>
                      {step.description || step.action}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          <div className="space-y-2 font-mono text-xs">
            {logs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Click Execute to start the workflow
              </div>
            )}
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  log.type === 'error'
                    ? 'bg-red-500/10 text-red-500'
                    : log.type === 'completed'
                    ? 'bg-green-500/10 text-green-500'
                    : log.type === 'started'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="flex-1 break-all">{log.message}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
