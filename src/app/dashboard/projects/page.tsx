import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
} from "@/lib/utils-format";

export default async function ProjectsPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";

  const projects = await db.project.findMany({
    include: { manager: true, budgetEntries: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in the program
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/projects/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => {
                const spent = p.budgetEntries
                  .filter((e) => e.type === "EXPENSE")
                  .reduce((s, e) => s + Number(e.amount), 0);
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={undefined}
                  >
                    <TableCell>
                      <Link href={`/dashboard/projects/${p.id}`} className="block">
                        <p className="font-medium hover:underline">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.code}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[p.status]}>
                        {statusLabels[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityColors[p.priority]}>
                        {priorityLabels[p.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{p.manager.name}</TableCell>
                    <TableCell className="text-right text-sm">
                      <div>{formatCurrency(Number(p.budgetTotal))}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(spent)} spent
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No projects yet.
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
