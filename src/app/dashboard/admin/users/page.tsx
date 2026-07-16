import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { deleteUser } from "@/lib/actions/users";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleSelect } from "@/components/dashboard/RoleSelect";
import { ConfirmDeleteButton } from "@/components/dashboard/ConfirmDeleteButton";
import { formatDate } from "@/lib/utils-format";

export default async function ManageUsersPage() {
  const session = await requireAdmin();

  const users = await db.user.findMany({
    include: { _count: { select: { allocations: true, managedProjects: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? "s" : ""} with dashboard access
          </p>
        </div>
        <Link href="/dashboard/admin/users/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          New User
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === session.user.id;
                const initials = u.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {u.name} {isSelf && <span className="text-muted-foreground">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.title ?? "—"}
                    </TableCell>
                    <TableCell>
                      <RoleSelect userId={u.id} role={u.role} disabled={isSelf} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u._count.managedProjects} managed · {u._count.allocations} assigned
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      {!isSelf && (
                        <ConfirmDeleteButton
                          action={deleteUser.bind(null, u.id)}
                          confirmMessage="Delete?"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
