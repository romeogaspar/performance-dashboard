"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

const projectSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  description: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "AT_RISK", "COMPLETED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  progress: z.coerce.number().min(0).max(100),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budgetTotal: z.coerce.number().min(0),
  managerId: z.string().min(1),
});

export type ProjectFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProject(
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();

  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    const project = await db.project.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        progress: data.progress,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budgetTotal: data.budgetTotal,
        managerId: data.managerId,
      },
    });
    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard");
    redirect(`/dashboard/projects/${project.id}`);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "A project with that code already exists." };
    }
    throw e;
  }
}

export async function updateProject(
  projectId: string,
  _prev: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();

  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  await db.project.update({
    where: { id: projectId },
    data: {
      name: data.name,
      code: data.code,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      progress: data.progress,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      budgetTotal: data.budgetTotal,
      managerId: data.managerId,
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  await requireAdmin();
  await db.project.delete({ where: { id: projectId } });
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  redirect("/dashboard/projects");
}
