"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Settings,
  Eye,
  Clock,
  TrendingUp,
  Star,
  Plus,
  Zap,
} from 'lucide-react';
import { fetchBackendAuth } from '@/lib/api-client';

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_time_minutes: number;
  expected_roi: string;
  file_path: string;
}

interface WorkflowLibraryProps {
  onSelectWorkflow: (workflowId: string) => void;
  onCreateNew: () => void;
  userId?: string; // SECURITY: Required for multi-tenancy
  token?: string; // Auth token for API calls
}

const ROI_ICONS: { [key: string]: string } = {
  high: '⭐⭐⭐⭐',
  very_high: '⭐⭐⭐⭐⭐',
  compound_growth: '🚀📈',
};

const DIFFICULTY_COLORS: { [key: string]: string } = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500',
};

const CATEGORY_ICONS: { [key: string]: string } = {
  engagement: '💬',
  growth: '📈',
  retention: '🔄',
  optimization: '🧠',
  custom: '⚙️',
};

export function WorkflowLibrary({ onSelectWorkflow, onCreateNew, userId }: WorkflowLibraryProps) {
  const { getToken } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      // SECURITY: MUST pass user_id to prevent cross-user data leakage
      if (!userId) {
        console.error('⚠️  SECURITY: Cannot load workflows without userId!');
        setLoading(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error('⚠️  No auth token available');
        setLoading(false);
        return;
      }
      setAuthToken(token);

      console.log('🔒 Loading workflows for user:', userId);
      const response = await fetchBackendAuth(`/api/workflows?user_id=${userId}`, token);
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(workflows.map((w) => w.category)))];

  const filteredWorkflows =
    selectedCategory === 'all'
      ? workflows
      : workflows.filter((w) => w.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Library</h2>
          <p className="text-muted-foreground">
            Choose from pre-built workflows or create your own
          </p>
        </div>
        <Button onClick={onCreateNew} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create New Workflow
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
          >
            {CATEGORY_ICONS[category] || '📁'} {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card
            key={workflow.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelectWorkflow(workflow.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {CATEGORY_ICONS[workflow.category] || '⚙️'}
                    {workflow.name}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {workflow.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{workflow.estimated_time_minutes} mins</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs">{ROI_ICONS[workflow.expected_roi]}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={`${DIFFICULTY_COLORS[workflow.difficulty]} text-white`}
                >
                  {workflow.difficulty}
                </Badge>
                <Badge variant="outline">{workflow.category}</Badge>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWorkflow(workflow.id);
                  }}
                  className="flex-1"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    executeWorkflow(workflow.id, userId, authToken);
                  }}
                  variant="default"
                  className="flex-1"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Run
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No workflows found in this category.</p>
          <Button onClick={onCreateNew} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create One
          </Button>
        </div>
      )}
    </div>
  );
}

async function executeWorkflow(workflowId: string, userId?: string, token?: string | null) {
  try {
    // SECURITY: MUST pass user_id and token to prevent cross-user workflow access
    if (!userId || !token) {
      console.error('⚠️  SECURITY: Cannot execute workflow without userId and token!');
      alert('Error: User authentication required to execute workflows.');
      return;
    }

    console.log('🔒 Loading workflow for user:', userId);

    // Load workflow JSON - SECURITY: Add user_id and auth token
    const response = await fetchBackendAuth(`/api/workflows/${workflowId}?user_id=${userId}`, token);
    const workflowJson = await response.json();

    // Execute it - SECURITY: Pass actual userId and token
    console.log('🔒 Executing workflow for user:', userId);
    const executeResponse = await fetchBackendAuth('/api/workflow/execute', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_json: workflowJson,
        user_id: userId,
      }),
    });

    const result = await executeResponse.json();
    console.log('Workflow execution started:', result);
    alert(`Workflow "${workflowJson.name}" is now running! Check console for updates.`);
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    alert('Failed to execute workflow. Check console for details.');
  }
}
