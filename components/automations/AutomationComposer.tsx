"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { createCronJob } from "@/hooks/useCrons";
import {
  PRESET_SCHEDULES,
  type PresetScheduleKey,
  buildCronExpression,
  isValidCronExpression,
  cronToHumanReadable,
} from "@/lib/schedule-helper";
import { useWorkflows, getWorkflowById, type WorkflowDefinition } from "@/lib/workflows";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Calendar, Sparkles, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AutomationComposerProps {
  assistantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AutomationComposer({
  assistantId,
  isOpen,
  onClose,
  onSuccess,
}: AutomationComposerProps) {
  const { getToken } = useAuth();
  const { data: workflowsData, isLoading: workflowsLoading } = useWorkflows();
  const workflows = workflowsData?.workflows || [];
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [workflow, setWorkflow] = useState<string>("");
  const [useWorkflow, setUseWorkflow] = useState(true); // Toggle between workflow and custom prompt
  const [scheduleType, setScheduleType] = useState<PresetScheduleKey>("daily_morning");
  const [customCron, setCustomCron] = useState("");
  const [customHour, setCustomHour] = useState("9");
  const [customMinute, setCustomMinute] = useState("0");

  // Auto-fill name and schedule when workflow is selected
  useEffect(() => {
    if (workflow && useWorkflow) {
      const selectedWorkflow = getWorkflowById(workflows, workflow);
      if (selectedWorkflow) {
        if (!name) {
          setName(selectedWorkflow.name);
        }
      }
    }
  }, [workflow, useWorkflow, name, workflows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate that either workflow or prompt is provided
      if (useWorkflow && !workflow) {
        alert("Please select a workflow");
        setIsSubmitting(false);
        return;
      }

      if (!useWorkflow && !prompt) {
        alert("Please provide a custom prompt");
        setIsSubmitting(false);
        return;
      }

      // Build cron expression
      let cronExpression: string;
      if (scheduleType === "custom" && customCron) {
        if (!isValidCronExpression(customCron)) {
          alert("Invalid cron expression. Please check the format.");
          setIsSubmitting(false);
          return;
        }
        cronExpression = customCron;
      } else if (scheduleType === "custom") {
        // Build from time inputs
        cronExpression = buildCronExpression(
          parseInt(customHour),
          parseInt(customMinute)
        );
      } else {
        cronExpression = PRESET_SCHEDULES[scheduleType].cron;
      }

      // Create cron job via backend API
      const token = await getToken();
      if (!token) {
        alert("Authentication required. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      await createCronJob({
        name,
        schedule: cronExpression,
        workflow_id: useWorkflow && workflow ? workflow : undefined,
        custom_prompt: !useWorkflow && prompt ? prompt : undefined,
        input_config: {
          schedule_type: scheduleType,
        },
      }, token);

      // Reset form
      setName("");
      setPrompt("");
      setWorkflow("");
      setUseWorkflow(true);
      setScheduleType("daily_morning");
      setCustomCron("");

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create automation:", error);
      alert(
        `Failed to create automation: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSchedulePreview = () => {
    if (scheduleType === "custom") {
      if (customCron && isValidCronExpression(customCron)) {
        return cronToHumanReadable(customCron);
      }
      const hour = parseInt(customHour);
      const minute = parseInt(customMinute);
      if (!isNaN(hour) && !isNaN(minute)) {
        const cron = buildCronExpression(hour, minute);
        return cronToHumanReadable(cron);
      }
      return "Invalid schedule";
    }
    return PRESET_SCHEDULES[scheduleType].label;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Automation</DialogTitle>
          <DialogDescription>
            Schedule your agent to run automatically at specific times
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Automation Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Automation Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Daily engagement task"
              required
            />
          </div>

          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={useWorkflow ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUseWorkflow(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Use Workflow
            </Button>
            <Button
              type="button"
              variant={!useWorkflow ? "default" : "outline"}
              className="flex-1"
              onClick={() => setUseWorkflow(false)}
            >
              <FileCode className="h-4 w-4 mr-2" />
              Custom Prompt
            </Button>
          </div>

          {/* Workflow Selection */}
          {useWorkflow ? (
            <div className="space-y-2">
              <Label htmlFor="workflow">Select Workflow *</Label>
              <Select value={workflow} onValueChange={setWorkflow} disabled={workflowsLoading}>
                <SelectTrigger id="workflow">
                  <SelectValue placeholder={workflowsLoading ? "Loading workflows..." : "Choose a pre-built workflow"} />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((wf) => (
                    <SelectItem key={wf.id} value={wf.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wf.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {wf.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workflow && (() => {
                const selected = getWorkflowById(workflows, workflow);
                return selected ? (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {selected.description}
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>⏱️ {selected.estimatedTime}</span>
                      {selected.expected_roi && (
                        <span>📈 ROI: {selected.expected_roi}</span>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="prompt">Custom Agent Prompt *</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Find and engage with viral threads about AI. Comment only on high-quality posts."
                rows={4}
                required={!useWorkflow}
              />
              <p className="text-sm text-muted-foreground">
                Write custom instructions for the agent to execute
              </p>
            </div>
          )}

          {/* Schedule Type */}
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule *</Label>
            <Select
              value={scheduleType}
              onValueChange={(value) => setScheduleType(value as PresetScheduleKey)}
            >
              <SelectTrigger id="schedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESET_SCHEDULES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Schedule Inputs */}
          {scheduleType === "custom" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Custom Time</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={customHour}
                    onChange={(e) => setCustomHour(e.target.value)}
                    placeholder="Hour (0-23)"
                    className="w-24"
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinute}
                    onChange={(e) => setCustomMinute(e.target.value)}
                    placeholder="Minute"
                    className="w-24"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customCron">
                  Or enter raw cron expression (advanced)
                </Label>
                <Input
                  id="customCron"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 9,14,19 * * *"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Format: minute hour day month dayOfWeek
                </p>
              </div>
            </div>
          )}

          {/* Schedule Preview */}
          <div className="p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Schedule:</span>
              <span>{getSchedulePreview()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !name ||
                (useWorkflow && !workflow) ||
                (!useWorkflow && !prompt)
              }
            >
              {isSubmitting ? "Creating..." : "Create Automation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
