"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { deleteCronJob, type CronJob } from "@/hooks/useCrons";
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
import { Clock, Trash2, Calendar, Code } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CronJobCardProps {
  cronJob: CronJob;
  onDeleted?: () => void;
}

export function CronJobCard({ cronJob, onDeleted }: CronJobCardProps) {
  const { getToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
            <Badge variant="outline" className="text-xs">
              Active
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
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled
          >
            View History
          </Button>
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
    </>
  );
}
