import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, CalendarDays, User as UserIcon, CheckCircle2, Circle } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { deleteProject } from "@/lib/actions/projects";
import { deleteAllocation } from "@/lib/actions/allocations";
import { deleteBudgetEntry } from "@/lib/actions/budget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddAllocationDialog } from "@/components/dashboard/AddAllocationDialog";
import { AddBudgetEntryDialog } from "@/components/dashboard/AddBudgetEntryDialog";
import { ConfirmDeleteButton } from "@/components/dashboard/ConfirmDeleteButton";
import {
  categoryLabels,
  formatCurrency,
  formatDate,
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
} from "@/lib/utils-format";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";
  const { id } = await params;

  const [project, allUsers] = await Promise.all([
    db.project.findUnique({
      where: { id },
      include: {
        manager: true,
        allocations: { include: { user: true }, orderBy: { allocationPct: "desc" } },
        budgetEntries: { orderBy: { date: "desc" } },
        milestones: { orderBy: { dueDate: "asc" } },
      },
    }),
    db.user.findMany({
      select: { id: true, name: true, title: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) notFound();

  const allocated = project.budgetEntries
    .filter((e) => e.type === "ALLOCATED")
    .reduce((s, e) => s + Number(e.amount), 0);
  const spent = project.budgetEntries
    .filter((e) => e.type === "EXPENSE")
    .reduce((s, e) => s + Number(e.amount), 0);
  const remaining = Number(project.budgetTotal) - spent;

  const categoryBreakdown = ["LABOR", "MATERIALS", "SOFTWARE", "TRAVEL", "OTHER"].map((cat) => {
    const catAllocated = project.budgetEntries
      .filter((e) => e.category === cat && e.type === "ALLOCATED")
      .reduce((s, e) => s + Number(e.amount), 0);
    const catSpent = project.budgetEntries
      .filter((e) => e.category === cat && e.type === "EXPENSE")
      .reduce((s, e) => s + Number(e.amount), 0);
    return { category: cat, allocated: catAllocated, spent: catSpent };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/dashboard/projects" className="hover:underline">
              Projects
            </Link>
            <span>/</span>
            <span>{project.code}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
            <Badge variant="outline" className={priorityColors[project.priority]}>
              {priorityLabels[project.priority]} priority
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" /> {project.manager.name}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(project.startDate)} – {formatDate(project.endDate)}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/dashboard/projects/${project.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <ConfirmDeleteButton
              action={deleteProject.bind(null, project.id)}
              confirmMessage="Delete project?"
              label="Delete"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-2">
            <p className="text-xs font-medium text-muted-foreground">Progress</p>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={project.progress} className="h-2 flex-1" />
              <span className="text-sm font-semibold">{project.progress}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2">
            <p className="text-xs font-medium text-muted-foreground">Total Budget</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(Number(project.budgetTotal))}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(remaining)} remaining
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2">
            <p className="text-xs font-medium text-muted-foreground">Spent to Date</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(spent)}</p>
            <p className="text-xs text-muted-foreground">
              {allocated > 0 ? Math.round((spent / allocated) * 100) : 0}% of allocated
            </p>
          </CardContent>
        </Card>
      </div>

      {project.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {project.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3 text-sm">
                  {m.completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={m.completed ? "text-muted-foreground line-through" : ""}>
                    {m.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(m.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Resource Allocation</CardTitle>
            <CardDescription>Who is working on this project</CardDescription>
          </div>
          {isAdmin && (
            <AddAllocationDialog
              projectId={project.id}
              startDate={project.startDate.toISOString()}
              endDate={project.endDate.toISOString()}
              people={allUsers}
            />
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead>Dates</TableHead>
                {isAdmin && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.allocations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.roleOnProject}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={a.allocationPct} className="h-1.5 w-16" />
                      <span className="text-xs">{a.allocationPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(a.startDate)} – {formatDate(a.endDate)}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <ConfirmDeleteButton
                        action={deleteAllocation.bind(null, a.id, project.id)}
                        confirmMessage="Remove?"
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {project.allocations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No one is allocated to this project yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Budget by Category</CardTitle>
            <CardDescription>Allocated vs. spent</CardDescription>
          </div>
          {isAdmin && <AddBudgetEntryDialog projectId={project.id} />}
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryBreakdown.map((c) => (
            <div key={c.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{categoryLabels[c.category]}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(c.spent)} / {formatCurrency(c.allocated)}
                </span>
              </div>
              <Progress
                value={c.allocated > 0 ? Math.min(100, (c.spent / c.allocated) * 100) : 0}
                className="h-2"
              />
            </div>
          ))}

          <Separator className="my-4" />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {isAdmin && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.budgetEntries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(e.date)}
                  </TableCell>
                  <TableCell className="text-sm">{categoryLabels[e.category]}</TableCell>
                  <TableCell>
                    <Badge variant={e.type === "EXPENSE" ? "default" : "secondary"}>
                      {e.type === "EXPENSE" ? "Expense" : "Allocated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                    {e.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrency(Number(e.amount))}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <ConfirmDeleteButton
                        action={deleteBudgetEntry.bind(null, e.id, project.id)}
                        confirmMessage="Delete?"
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {project.budgetEntries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 6 : 5}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No budget entries recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
