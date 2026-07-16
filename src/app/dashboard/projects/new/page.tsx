import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { createProject } from "@/lib/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/dashboard/ProjectForm";

export default async function NewProjectPage() {
  await requireAdmin();
  const managers = await db.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Project</h1>
        <p className="text-sm text-muted-foreground">
          Add a new project to the performance matrix.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm action={createProject} managers={managers} submitLabel="Create Project" />
        </CardContent>
      </Card>
    </div>
  );
}
