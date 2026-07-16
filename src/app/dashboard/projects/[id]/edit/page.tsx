import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { updateProject } from "@/lib/actions/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/dashboard/ProjectForm";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [project, managers] = await Promise.all([
    db.project.findUnique({ where: { id } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  const updateWithId = updateProject.bind(null, project.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Project</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={updateWithId}
            managers={managers}
            submitLabel="Save Changes"
            initial={{
              name: project.name,
              code: project.code,
              description: project.description,
              status: project.status,
              priority: project.priority,
              progress: project.progress,
              startDate: project.startDate.toISOString(),
              endDate: project.endDate.toISOString(),
              budgetTotal: Number(project.budgetTotal),
              managerId: project.managerId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
