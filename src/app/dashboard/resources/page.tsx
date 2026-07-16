import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceUtilizationChart } from "@/components/charts/ResourceUtilizationChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Users2, AlertTriangle, Gauge } from "lucide-react";

export default async function ResourcesPage() {
  const users = await db.user.findMany({
    include: {
      allocations: {
        include: { project: true },
        where: { project: { status: { not: "COMPLETED" } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = users.map((u) => {
    const totalPct = u.allocations.reduce((s, a) => s + a.allocationPct, 0);
    return { user: u, totalPct, allocations: u.allocations };
  });

  const overallocated = rows.filter((r) => r.totalPct > 100).length;
  const avgUtilization =
    rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.totalPct, 0) / rows.length) : 0;

  const chartData = rows
    .filter((r) => r.allocations.length > 0)
    .sort((a, b) => b.totalPct - a.totalPct)
    .map((r) => ({ name: r.user.name, utilization: r.totalPct }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resource Allocation</h1>
        <p className="text-sm text-muted-foreground">
          Team capacity across all active projects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Team Members" value={String(users.length)} icon={Users2} />
        <KpiCard
          label="Avg. Utilization"
          value={`${avgUtilization}%`}
          icon={Gauge}
          tone={avgUtilization > 90 ? "warning" : "default"}
        />
        <KpiCard
          label="Overallocated"
          value={String(overallocated)}
          icon={AlertTriangle}
          tone={overallocated > 0 ? "danger" : "success"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilization by Person</CardTitle>
          <CardDescription>Percent of capacity currently allocated</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResourceUtilizationChart data={chartData} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active allocations yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Allocation Matrix</CardTitle>
          <CardDescription>Every person and their active project assignments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Active Projects</TableHead>
                <TableHead className="w-48">Total Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ user, totalPct, allocations }) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.title ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {allocations.length === 0 && (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                      {allocations.map((a) => (
                        <Badge key={a.id} variant="secondary" className="font-normal">
                          {a.project.code} ({a.allocationPct}%)
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(100, totalPct)}
                        className={totalPct > 100 ? "h-2 [&>div]:bg-red-500" : "h-2"}
                      />
                      <span
                        className={
                          totalPct > 100
                            ? "text-xs font-semibold text-red-600"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {totalPct}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
