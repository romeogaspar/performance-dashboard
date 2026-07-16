import { PrismaClient, Role, ProjectStatus, ProjectPriority, BudgetCategory, BudgetEntryType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding database...");

  // --- Users ---
  const admin = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Alex Morgan",
      email: "admin@example.com",
      passwordHash: await hash("Admin123!"),
      role: Role.ADMIN,
      title: "Program Director",
      capacityHrsWk: 40,
    },
  });

  const demoUser = await db.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "Jamie Rivera",
      email: "user@example.com",
      passwordHash: await hash("User123!"),
      role: Role.USER,
      title: "Project Coordinator",
      capacityHrsWk: 40,
    },
  });

  const teamData = [
    { name: "Priya Nair", email: "priya@example.com", title: "Senior Engineer" },
    { name: "Marcus Chen", email: "marcus@example.com", title: "UX Designer" },
    { name: "Sofia Reyes", email: "sofia@example.com", title: "Data Analyst" },
    { name: "Ben Carter", email: "ben@example.com", title: "QA Engineer" },
    { name: "Lena Kowalski", email: "lena@example.com", title: "DevOps Engineer" },
  ];

  const team = [];
  for (const t of teamData) {
    const u = await db.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        passwordHash: await hash("User123!"),
        role: Role.USER,
        title: t.title,
        capacityHrsWk: 40,
      },
    });
    team.push(u);
  }

  const allUsers = [demoUser, ...team];

  // --- Projects ---
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000);

  const projectDefs = [
    {
      name: "Customer Portal Revamp",
      code: "PRJ-101",
      description: "Redesign and rebuild the customer-facing self-service portal.",
      status: ProjectStatus.IN_PROGRESS,
      priority: ProjectPriority.HIGH,
      progress: 62,
      startDate: daysAgo(60),
      endDate: daysFromNow(45),
      budgetTotal: 180000,
      managerId: admin.id,
    },
    {
      name: "Mobile App Launch",
      code: "PRJ-102",
      description: "Ship v1 of the native mobile app for iOS and Android.",
      status: ProjectStatus.AT_RISK,
      priority: ProjectPriority.CRITICAL,
      progress: 38,
      startDate: daysAgo(90),
      endDate: daysFromNow(20),
      budgetTotal: 250000,
      managerId: admin.id,
    },
    {
      name: "Data Warehouse Migration",
      code: "PRJ-103",
      description: "Migrate legacy reporting data to the new cloud warehouse.",
      status: ProjectStatus.IN_PROGRESS,
      priority: ProjectPriority.MEDIUM,
      progress: 80,
      startDate: daysAgo(120),
      endDate: daysFromNow(10),
      budgetTotal: 95000,
      managerId: demoUser.id,
    },
    {
      name: "Internal Tools Consolidation",
      code: "PRJ-104",
      description: "Merge three internal admin tools into a single platform.",
      status: ProjectStatus.NOT_STARTED,
      priority: ProjectPriority.LOW,
      progress: 0,
      startDate: daysFromNow(15),
      endDate: daysFromNow(120),
      budgetTotal: 60000,
      managerId: demoUser.id,
    },
    {
      name: "Q3 Marketing Site Refresh",
      code: "PRJ-105",
      description: "Refresh the public marketing site ahead of the Q3 campaign.",
      status: ProjectStatus.COMPLETED,
      priority: ProjectPriority.MEDIUM,
      progress: 100,
      startDate: daysAgo(150),
      endDate: daysAgo(20),
      budgetTotal: 45000,
      managerId: admin.id,
    },
    {
      name: "Security Compliance Audit",
      code: "PRJ-106",
      description: "Close out findings from the annual SOC 2 audit.",
      status: ProjectStatus.ON_HOLD,
      priority: ProjectPriority.HIGH,
      progress: 25,
      startDate: daysAgo(30),
      endDate: daysFromNow(60),
      budgetTotal: 70000,
      managerId: admin.id,
    },
  ];

  const projects = [];
  for (const p of projectDefs) {
    const project = await db.project.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
    projects.push(project);
  }

  // --- Resource allocations ---
  // Spread team members across projects with varied allocation percentages.
  const allocationPlan: Record<string, { userIdx: number; pct: number; role: string }[]> = {
    "PRJ-101": [
      { userIdx: 1, pct: 60, role: "Lead Engineer" },
      { userIdx: 2, pct: 40, role: "Designer" },
      { userIdx: 0, pct: 30, role: "Coordinator" },
    ],
    "PRJ-102": [
      { userIdx: 1, pct: 40, role: "Engineer" },
      { userIdx: 4, pct: 50, role: "QA" },
      { userIdx: 5, pct: 30, role: "DevOps" },
    ],
    "PRJ-103": [
      { userIdx: 3, pct: 70, role: "Data Analyst" },
      { userIdx: 5, pct: 40, role: "DevOps" },
    ],
    "PRJ-104": [
      { userIdx: 0, pct: 20, role: "Coordinator" },
    ],
    "PRJ-105": [
      { userIdx: 2, pct: 50, role: "Designer" },
      { userIdx: 0, pct: 20, role: "Coordinator" },
    ],
    "PRJ-106": [
      { userIdx: 4, pct: 30, role: "QA" },
      { userIdx: 5, pct: 20, role: "DevOps" },
    ],
  };

  for (const project of projects) {
    const plan = allocationPlan[project.code] ?? [];
    for (const a of plan) {
      const user = allUsers[a.userIdx];
      await db.resourceAllocation.upsert({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
        update: {},
        create: {
          projectId: project.id,
          userId: user.id,
          allocationPct: a.pct,
          roleOnProject: a.role,
          startDate: project.startDate,
          endDate: project.endDate,
        },
      });
    }
  }

  // --- Budget entries ---
  const categories = [
    BudgetCategory.LABOR,
    BudgetCategory.SOFTWARE,
    BudgetCategory.MATERIALS,
    BudgetCategory.TRAVEL,
    BudgetCategory.OTHER,
  ];

  for (const project of projects) {
    const total = Number(project.budgetTotal);
    // Allocated split across categories
    const splits = [0.55, 0.2, 0.1, 0.08, 0.07];
    for (let i = 0; i < categories.length; i++) {
      await db.budgetEntry.create({
        data: {
          projectId: project.id,
          category: categories[i],
          type: BudgetEntryType.ALLOCATED,
          amount: Math.round(total * splits[i]),
          description: `Allocated budget for ${categories[i].toLowerCase()}`,
          date: project.startDate,
        },
      });
    }

    // Expenses so far, proportional to progress, with some variance
    const spendFactor = (project.progress / 100) * (0.85 + Math.random() * 0.3);
    for (let i = 0; i < categories.length; i++) {
      const allocated = total * splits[i];
      const spent = allocated * spendFactor * (0.7 + Math.random() * 0.5);
      if (spent < 1) continue;
      await db.budgetEntry.create({
        data: {
          projectId: project.id,
          category: categories[i],
          type: BudgetEntryType.EXPENSE,
          amount: Math.round(spent),
          description: `${categories[i]} spend to date`,
          date: daysAgo(Math.floor(Math.random() * 30)),
        },
      });
    }
  }

  // --- Milestones ---
  for (const project of projects.slice(0, 3)) {
    await db.milestone.createMany({
      data: [
        { projectId: project.id, name: "Kickoff", dueDate: project.startDate, completed: true },
        { projectId: project.id, name: "Mid-point review", dueDate: new Date((project.startDate.getTime() + project.endDate.getTime()) / 2), completed: project.progress > 50 },
        { projectId: project.id, name: "Launch", dueDate: project.endDate, completed: project.progress >= 100 },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:  admin@example.com / Admin123!");
  console.log("User login:   user@example.com / User123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
