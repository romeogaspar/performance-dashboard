"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProjectFormState } from "@/lib/actions/projects";

type Manager = { id: string; name: string };

type ProjectFormProps = {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  managers: Manager[];
  submitLabel: string;
  initial?: {
    name: string;
    code: string;
    description: string | null;
    status: string;
    priority: string;
    progress: number;
    startDate: string;
    endDate: string;
    budgetTotal: number;
    managerId: string;
  };
};

function toDateInput(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function ProjectForm({ action, managers, submitLabel, initial }: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" name="name" defaultValue={initial?.name} required />
          {errors.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Project Code</Label>
          <Input id="code" name="code" defaultValue={initial?.code} placeholder="PRJ-107" required />
          {errors.code && <p className="text-xs text-destructive">{errors.code[0]}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={initial?.description ?? ""} rows={3} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={initial?.status ?? "NOT_STARTED"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="AT_RISK">At Risk</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={initial?.priority ?? "MEDIUM"}>
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            defaultValue={initial?.progress ?? 0}
            required
          />
          {errors.progress && <p className="text-xs text-destructive">{errors.progress[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInput(initial?.startDate)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Target End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInput(initial?.endDate)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budgetTotal">Total Budget ($)</Label>
          <Input
            id="budgetTotal"
            name="budgetTotal"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initial?.budgetTotal}
            required
          />
          {errors.budgetTotal && (
            <p className="text-xs text-destructive">{errors.budgetTotal[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="managerId">Project Manager</Label>
          <Select name="managerId" defaultValue={initial?.managerId}>
            <SelectTrigger id="managerId" className="w-full">
              <SelectValue placeholder="Select a manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
