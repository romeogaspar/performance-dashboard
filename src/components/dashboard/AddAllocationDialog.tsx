"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAllocation, type AllocationFormState } from "@/lib/actions/allocations";

type Person = { id: string; name: string; title: string | null };

export function AddAllocationDialog({
  projectId,
  startDate,
  endDate,
  people,
}: {
  projectId: string;
  startDate: string;
  endDate: string;
  people: Person[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<AllocationFormState>({});

  async function handleSubmit(formData: FormData) {
    setPending(true);
    const result = await createAllocation(state, formData);
    setPending(false);
    setState(result);
    if (!result.error && !result.fieldErrors) {
      setOpen(false);
      setState({});
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4" />
        Assign Person
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a resource</DialogTitle>
          <DialogDescription>
            Allocate a team member&apos;s capacity to this project.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="userId">Team member</Label>
            <Select name="userId" required>
              <SelectTrigger id="userId" className="w-full">
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.title ? `— ${p.title}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.userId && (
              <p className="text-xs text-destructive">{state.fieldErrors.userId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleOnProject">Role on project</Label>
            <Input id="roleOnProject" name="roleOnProject" placeholder="e.g. Engineer" required />
            {state.fieldErrors?.roleOnProject && (
              <p className="text-xs text-destructive">{state.fieldErrors.roleOnProject[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocationPct">Allocation (% of capacity)</Label>
            <Input
              id="allocationPct"
              name="allocationPct"
              type="number"
              min={1}
              max={100}
              defaultValue={50}
              required
            />
            {state.fieldErrors?.allocationPct && (
              <p className="text-xs text-destructive">{state.fieldErrors.allocationPct[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={startDate.slice(0, 10)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={endDate.slice(0, 10)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Assigning..." : "Assign"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
