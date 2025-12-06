"use client";

import { useCallback, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomWorkflowNode from './custom-workflow-node';
import { WorkflowAgentChat } from './workflow-agent-chat';
import { WorkflowVNCViewer } from './workflow-vnc-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Settings,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';

// Node Types for Workflow Steps
const nodeTypes = {
  navigate: { label: 'Navigate', color: 'bg-blue-500', icon: '🧭' },
  analyze: { label: 'Analyze', color: 'bg-purple-500', icon: '🔍' },
  action: { label: 'Action', color: 'bg-green-500', icon: '⚡' },
  loop: { label: 'Loop', color: 'bg-yellow-500', icon: '🔄' },
  research: { label: 'Research', color: 'bg-cyan-500', icon: '📚' },
  memory: { label: 'Memory', color: 'bg-pink-500', icon: '💾' },
  condition: { label: 'Condition', color: 'bg-orange-500', icon: '❓' },
  filter: { label: 'Filter', color: 'bg-indigo-500', icon: '🔎' },
  end: { label: 'End', color: 'bg-gray-500', icon: '✅' },
};

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: any) => void;
}

export function WorkflowBuilder({ workflowId, onSave }: WorkflowBuilderProps) {
  const { getToken } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showJSON, setShowJSON] = useState(false);
  const [showExecution, setShowExecution] = useState(true);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [vncIsExecuting, setVncIsExecuting] = useState(false);

  // Define custom node types
  const customNodeTypes = useMemo(() => ({ custom: CustomWorkflowNode }), []);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Load workflow if workflowId provided
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadWorkflow = async (id: string) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No auth token available");
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(`${backendUrl}/api/workflows/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();

      setWorkflowName(data.name);

      // Convert workflow steps to React Flow nodes
      const flowNodes = data.steps.map((step: any, index: number) => ({
        id: step.id,
        type: 'custom',
        position: { x: 250, y: index * 120 },
        data: {
          label: step.description || step.action,
          stepType: step.type,
          params: step.params || {},
        },
      }));

      // Create edges based on "next" relationships
      const flowEdges = data.steps
        .filter((step: any) => step.next)
        .map((step: any) => ({
          id: `${step.id}-${step.next}`,
          source: step.id,
          target: step.next,
          animated: true,
        }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const addNode = (type: keyof typeof nodeTypes) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
      data: {
        label: `${nodeTypes[type].label} ${nodes.length + 1}`,
        stepType: type,
        params: {},
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const deleteNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) =>
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
    }
  };

  const generateWorkflowJSON = () => {
    const workflow = {
      workflow_id: workflowId || `workflow_${Date.now()}`,
      name: workflowName,
      description: 'Custom workflow created with drag-and-drop builder',
      category: 'custom',
      difficulty: 'intermediate',
      estimated_time_minutes: 30,
      expected_roi: 'high',
      version: '1.0',
      config: {},
      steps: nodes.map((node, index) => {
        const outgoingEdge = edges.find((edge) => edge.source === node.id);
        return {
          id: node.id,
          type: node.data.stepType,
          action: node.data.label.toLowerCase().replace(/ /g, '_'),
          params: node.data.params || {},
          description: node.data.label,
          next: outgoingEdge ? outgoingEdge.target : index === nodes.length - 1 ? undefined : nodes[index + 1]?.id,
        };
      }),
      success_metrics: {},
      learning_enabled: false,
    };

    return workflow;
  };

  const executeWorkflow = async () => {
    setIsExecuting(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        setIsExecuting(false);
        return;
      }

      const workflow = generateWorkflowJSON();

      const backendUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8002';
      const response = await fetch(`${backendUrl}/api/workflow/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          workflow_json: workflow,
          user_id: null,
        }),
      });

      const result = await response.json();
      console.log('Workflow execution result:', result);
      alert(`Workflow execution ${result.status}! Check console for details.`);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      alert('Failed to execute workflow. Check console for details.');
    } finally {
      setIsExecuting(false);
    }
  };

  const saveWorkflow = () => {
    const workflow = generateWorkflowJSON();
    if (onSave) {
      onSave(workflow);
    }
    // Save to localStorage as backup
    localStorage.setItem(`workflow_${workflow.workflow_id}`, JSON.stringify(workflow));
    alert('Workflow saved!');
  };

  const downloadWorkflow = () => {
    const workflow = generateWorkflowJSON();
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.workflow_id}.json`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-card/50 p-4 space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2"
              placeholder="Workflow Name"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                // Trigger fresh execution by forcing Deep Agent Chat to reload
                // This causes the autoSend to trigger again with the latest workflow
                setShowExecution(false);
                setTimeout(() => {
                  setShowExecution(true);
                }, 100);
              }}
              variant="default"
              size="sm"
              className="bg-purple-500 hover:bg-purple-600"
              disabled={nodes.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Execute Workflow
            </Button>
            <Button
              onClick={() => {
                if (showJSON) {
                  // Currently showing JSON, about to hide it
                  // Restore the execution panel
                  setShowJSON(false);
                  setShowExecution(true);
                } else {
                  // Currently showing execution, about to show JSON
                  setShowJSON(true);
                  setShowExecution(false);
                }
              }}
              variant="outline"
              size="sm"
            >
              {showJSON ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showJSON ? 'Hide' : 'Show'} JSON
            </Button>
            <Button onClick={saveWorkflow} variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={downloadWorkflow} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Node Palette */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Add Steps:</span>
          {Object.entries(nodeTypes).map(([key, { label, icon, color }]) => (
            <Button
              key={key}
              onClick={() => addNode(key as keyof typeof nodeTypes)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Button>
          ))}
          {selectedNode && (
            <Button
              onClick={deleteNode}
              variant="destructive"
              size="sm"
              className="ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left - React Flow Canvas (Full Height) */}
        <div className="flex-1 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            nodeTypes={customNodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Right Panel - VNC + Execution/JSON */}
        <div className="w-[480px] border-l bg-card/50 overflow-hidden flex flex-col">
          {/* VNC Viewer - Collapsible */}
          <div className="border-b">
            <WorkflowVNCViewer isExecuting={vncIsExecuting} />
          </div>

          {/* Execution Panel or JSON View */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {showExecution ? (
              <WorkflowAgentChat
                workflowJson={generateWorkflowJSON()}
              />
            ) : showJSON ? (
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Workflow JSON</h3>
                  <Badge variant="secondary">{nodes.length} steps</Badge>
                </div>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(generateWorkflowJSON(), null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-card/50 px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{nodes.length} nodes</span>
          <span>{edges.length} connections</span>
        </div>
        {selectedNode && (
          <span>
            Selected: <Badge variant="secondary">{selectedNode.data.label}</Badge>
          </span>
        )}
      </div>
    </div>
  );
}
