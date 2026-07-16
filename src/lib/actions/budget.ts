"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

const budgetSchema = z.object({
  projectId: z.string().min(1),
  category: z.enum(["LABOR", "MATERIALS", "SOFTWARE", "TRAVEL", "OTHER"]),
  type: z.enum(["ALLOCATED", "EXPENSE"]),
  amount: z.coerce.number().min(0.01),
  description: z.string().optional(),
  date: z.string().min(1),
});

export type BudgetFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createBudgetEntry(
  _prev: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  await requireAdmin();

  const parsed = budgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  await db.budgetEntry.create({
    data: {
      projectId: data.projectId,
      category: data.category,
      type: data.type,
      amount: data.amount,
      description: data.description || null,
      date: new Date(data.date),
    },
  });

  revalidatePath(`/dashboard/projects/${data.projectId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function deleteBudgetEntry(entryId: string, projectId: string) {
  await requireAdmin();
  await db.budgetEntry.delete({ where: { id: entryId } });
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}
