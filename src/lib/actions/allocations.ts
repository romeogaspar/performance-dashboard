"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

const allocationSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  allocationPct: z.coerce.number().min(1).max(100),
  roleOnProject: z.string().min(1, "Role is required"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export type AllocationFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createAllocation(
  _prev: AllocationFormState,
  formData: FormData
): Promise<AllocationFormState> {
  await requireAdmin();

  const parsed = allocationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  try {
    await db.resourceAllocation.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        allocationPct: data.allocationPct,
        roleOnProject: data.roleOnProject,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "This person is already allocated to this project." };
    }
    throw e;
  }

  revalidatePath(`/dashboard/projects/${data.projectId}`);
  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard");
  return {};
}

export async function deleteAllocation(allocationId: string, projectId: string) {
  await requireAdmin();
  await db.resourceAllocation.delete({ where: { id: allocationId } });
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard");
}
