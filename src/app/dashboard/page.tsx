import Link from "next/link";
import {
  FolderKanban,
  TrendingUp,
  Wallet,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ProjectStatusChart } from "@/components/charts/ProjectStatusChart";
import { BudgetOverviewChart } from "@/components/charts/BudgetOverviewChart";
import { ProgressBarChart } from "@/components/charts/ProgressBarChart";
import { formatCurrency, statusColors, statusLabels } from "@/lib/utils-format";

export default async function DashboardOverviewPage() {
  const projects = await db.project.findMany({
    include: { budgetEntries: true, allocations: true },
    orderBy: { updatedAt: "desc" },
  });

  const totalProjects = projects.length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects)
      : 0;

  const totalAllocated = projects.reduce((sum, p) => sum + Number(p.budgetTotal), 0);
  const totalSpent = projects.reduce((sum, p) => {
    const spent = p.budgetEntries
      .filter((e) => e.type === "EXPENSE")
      .reduce((s, e) => s + Number(e.amount), 0);
    return sum + spent;
  }, 0);
  const utilizationPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const atRiskCount = projects.filter((p) => p.status === "AT_RISK").length;

  const statusCounts = Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const budgetChartData = projects.slice(0, 6).map((p) => ({
    name: p.code,
    allocated: Number(p.budgetTotal),
    spent: p.budgetEntries
      .filter((e) => e.type === "EXPENSE")
      .reduce((s, e) => s + Number(e.amount), 0),
  }));

  const progressChartData = projects
    .filter((p) => p.status !== "COMPLETED")
    .slice(0, 8)
    .map((p) => ({ name: p.code, progress: p.progress, status: p.status }));

  const activeProjects = projects.filter((p) => p.status !== "COMPLETED").slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Program Overview</h1>
        <p className="text-sm text-muted-foreground">
          A snapshot of project progress, resourcing, and budget across the program.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active Projects" value={String(totalProjects)} icon={FolderKanban} />
        <KpiCard
          label="Avg. Progress"
          value={`${avgProgress}%`}
          icon={TrendingUp}
          tone="success"
        />
        <KpiCard
          label="Budget Utilization"
          value={`${utilizationPct}%`}
          icon={Wallet}
          hint={`${formatCurrency(totalSpent)} of ${formatCurrency(totalAllocated)}`}
          tone={utilizationPct > 90 ? "danger" : "default"}
        />
        <KpiCard
          label="At Risk"
          value={String(atRiskCount)}
          icon={AlertTriangle}
          tone={atRiskCount > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Project Status</CardTitle>
            <CardDescription>Distribution across the program</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectStatusChart data={statusCounts} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Budget: Allocated vs. Spent</CardTitle>
            <CardDescription>By project (top 6)</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetOverviewChart data={budgetChartData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Progress by Project</CardTitle>
            <CardDescription>Active and at-risk projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBarChart data={progressChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Projects</CardTitle>
              <CardDescription>Needs attention</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <Badge variant="outline" className={statusColors[p.status]}>
                    {statusLabels[p.status]}
                  </Badge>
                </div>
                <span className="ml-2 shrink-0 text-xs font-semibold text-muted-foreground">
                  {p.progress}%
                </span>
              </Link>
            ))}
            <Button
              render={<Link href="/dashboard/projects" />}
              variant="ghost"
              className="w-full justify-between"
              size="sm"
            >
              View all projects <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
