"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { deleteCronJob, toggleCronJob, runCronJobNow, type CronJob } from "@/hooks/useCrons";
import { cronToHumanReadable, getNextRunTime } from "@/lib/schedule-helper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, Calendar, Code, Pause, Play, Zap, Cpu } from "lucide-react";

// Map model values to human-readable names
const MODEL_LABELS: Record<string, string> = {
  "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5",
  "claude-opus-4-5-20251101": "Claude Opus 4.5",
  "gpt-5.2": "GPT-5.2",
  "gpt-5.2-pro": "GPT-5.2 Pro",
  "gpt-5-mini": "GPT-5 Mini",
};
import { formatDistanceToNow } from "date-fns";

interface CronJobCardProps {
  cronJob: CronJob;
  onDeleted?: () => void;
}

export function CronJobCard({ cronJob, onDeleted }: CronJobCardProps) {
  const { getToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isActive, setIsActive] = useState(cronJob.is_active);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const name = cronJob.name || "Untitled Automation";
  const workflow = cronJob.workflow_id;

  const scheduleDescription = cronToHumanReadable(cronJob.schedule);
  const nextRun = getNextRunTime(cronJob.schedule);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        setIsDeleting(false);
        return;
      }

      await deleteCronJob(cronJob.id, token);
      onDeleted?.();
    } catch (error) {
      console.error("Failed to delete cron job:", error);
      alert("Failed to delete automation");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        setIsToggling(false);
        return;
      }

      const result = await toggleCronJob(cronJob.id, token);
      setIsActive(result.is_active);
    } catch (error) {
      console.error("Failed to toggle cron job:", error);
      alert("Failed to toggle automation");
    } finally {
      setIsToggling(false);
    }
  };

  const handleRunNow = async () => {
    setIsRunning(true);
    setRunError(null);
    try {
      const token = await getToken();
      if (!token) {
        setRunError("Authentication required. Please sign in again.");
        setIsRunning(false);
        return;
      }

      await runCronJobNow(cronJob.id, token);
      setShowRunDialog(false);
      // Could add a toast notification here for success
    } catch (error) {
      console.error("Failed to run automation:", error);
      setRunError(error instanceof Error ? error.message : "Failed to run automation");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {scheduleDescription}
              </CardDescription>
            </div>
            <Badge
              variant={isActive ? "outline" : "secondary"}
              className={`text-xs ${!isActive ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : ""}`}
            >
              {isActive ? "Active" : "Paused"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {workflow && (
            <div className="flex items-center gap-2 text-sm">
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Workflow:</span>
              <span className="text-muted-foreground">{workflow}</span>
            </div>
          )}

          {cronJob.input_config?.model_name && (
            <div className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Model:</span>
              <span className="text-muted-foreground">
                {MODEL_LABELS[cronJob.input_config.model_name] || cronJob.input_config.model_name}
              </span>
            </div>
          )}

          {nextRun && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Next run: {formatDistanceToNow(nextRun, { addSuffix: true })}
              </span>
            </div>
          )}

          {cronJob.last_run_at && (
            <div className="text-xs text-muted-foreground">
              Last run: {formatDistanceToNow(new Date(cronJob.last_run_at), { addSuffix: true })}
            </div>
          )}

          <div className="pt-2 text-xs text-muted-foreground">
            <div>Created: {new Date(cronJob.created_at).toLocaleDateString()}</div>
            <div className="font-mono text-xs mt-1">ID: {cronJob.id}</div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={isToggling}
              className={isActive ? "text-yellow-600 hover:text-yellow-700" : "text-green-600 hover:text-green-700"}
            >
              {isToggling ? (
                "..."
              ) : isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRunDialog(true)}
              disabled={isRunning}
              className="text-orange-600 hover:text-orange-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Run Now
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{name}" and stop all future scheduled runs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRunDialog} onOpenChange={(open) => {
        setShowRunDialog(open);
        if (!open) setRunError(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Automation Now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately execute "{name}" once. This does not affect the regular schedule.
              Credits will be charged based on usage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {runError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {runError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRunning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRunNow}
              disabled={isRunning}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isRunning ? "Starting..." : "Run Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
