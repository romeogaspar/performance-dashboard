"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "USER"]),
  title: z.string().optional(),
  capacityHrsWk: z.coerce.number().min(1).max(80).default(40),
});

export type UserFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createUser(
  _prev: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireAdmin();

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "A user with that email already exists." };
  }

  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
      title: data.title || null,
      capacityHrsWk: data.capacityHrsWk,
    },
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/resources");
  redirect("/dashboard/admin/users");
}

export async function updateUserRole(userId: string, role: "ADMIN" | "USER") {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    throw new Error("You cannot change your own role.");
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/dashboard/admin/users");
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    throw new Error("You cannot delete your own account.");
  }
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/resources");
}
