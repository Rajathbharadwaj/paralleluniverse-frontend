"use client";

import { useState } from 'react';
import { WorkflowLibrary } from '@/components/workflow-library';
import { WorkflowBuilder } from '@/components/workflow-builder';
import { ThreadHistory } from '@/components/thread-history';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutGrid, PenTool, History } from 'lucide-react';

type ViewMode = 'library' | 'builder' | 'edit' | 'history';

export default function WorkflowsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | undefined>();

  const handleSelectWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setViewMode('edit');
  };

  const handleCreateNew = () => {
    setSelectedWorkflowId(undefined);
    setViewMode('builder');
  };

  const handleBackToLibrary = () => {
    setViewMode('library');
    setSelectedWorkflowId(undefined);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <DashboardHeader />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* View Switcher */}
        <div className="border-b bg-card/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode !== 'library' && (
              <Button
                onClick={handleBackToLibrary}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewMode('library')}
                variant={viewMode === 'library' ? 'default' : 'ghost'}
                size="sm"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Library
              </Button>
              <Button
                onClick={handleCreateNew}
                variant={viewMode === 'builder' || viewMode === 'edit' ? 'default' : 'ghost'}
                size="sm"
              >
                <PenTool className="w-4 h-4 mr-2" />
                Builder
              </Button>
              <Button
                onClick={() => setViewMode('history')}
                variant={viewMode === 'history' ? 'default' : 'ghost'}
                size="sm"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
          </div>

          {viewMode === 'edit' && selectedWorkflowId && (
            <div className="text-sm text-muted-foreground">
              Editing: {selectedWorkflowId}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'library' && (
            <div className="h-full overflow-y-auto p-6">
              <WorkflowLibrary
                onSelectWorkflow={handleSelectWorkflow}
                onCreateNew={handleCreateNew}
              />
            </div>
          )}

          {(viewMode === 'builder' || viewMode === 'edit') && (
            <WorkflowBuilder
              workflowId={selectedWorkflowId}
              onSave={(workflow) => {
                console.log('Workflow saved:', workflow);
                // Could add API call here to persist to backend
              }}
            />
          )}

          {viewMode === 'history' && (
            <div className="h-full overflow-y-auto p-6">
              <ThreadHistory />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
