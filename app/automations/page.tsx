"use client";

import { useState } from "react";
import { useCrons } from "@/hooks/useCrons";
import { AutomationComposer } from "@/components/automations/AutomationComposer";
import { CronJobCard } from "@/components/automations/CronJobCard";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Default assistant ID for X Growth Deep Agent
const DEFAULT_ASSISTANT_ID = "x_growth_deep_agent";

export default function AutomationsPage() {
  const { data: cronJobs, error, mutate } = useCrons(DEFAULT_ASSISTANT_ID);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleAutomationCreated = () => {
    // Refresh the list
    mutate();
  };

  const handleAutomationDeleted = () => {
    // Refresh the list
    mutate();
  };

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground mt-2">
            Schedule your agent to run automatically at specific times
          </p>
        </div>
        <Button onClick={() => setIsComposerOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>How Automations Work</AlertTitle>
        <AlertDescription>
          Automations run your agent on a schedule. Each run creates a new thread and
          executes your configured workflow or prompt. The agent will automatically
          handle authentication and browser sessions for X/Twitter engagement.
        </AlertDescription>
      </Alert>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load automations. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {!cronJobs && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading automations...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {cronJobs && cronJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-24 w-24 text-muted-foreground/50 mb-6" />
          <h2 className="text-2xl font-semibold mb-2">No Automations Yet</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Create your first automation to schedule your agent to run automatically.
            Perfect for daily engagement, content discovery, and more.
          </p>
          <Button onClick={() => setIsComposerOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Automation
          </Button>
        </div>
      )}

      {/* Automations Grid */}
      {cronJobs && cronJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Active Automations ({cronJobs.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cronJobs.map((cronJob) => (
              <CronJobCard
                key={cronJob.cron_id}
                cronJob={cronJob}
                onDeleted={handleAutomationDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Automation Composer Modal */}
      <AutomationComposer
        assistantId={DEFAULT_ASSISTANT_ID}
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSuccess={handleAutomationCreated}
      />
      </div>
    </>
  );
}
