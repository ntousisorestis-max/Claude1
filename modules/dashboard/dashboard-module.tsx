"use client";

import { BellRing, CalendarCheck, ListChecks, ListTodo } from "lucide-react";

import { AI_WORKER_DEFINITIONS } from "@/lib/workers/registry";
import { useDiagnosticStore } from "@/lib/store/diagnostic-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";
import { WorkerCard } from "@/features/workers/worker-card";

function isSameDay(isoDate: string | undefined, reference: Date): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export function DashboardModule() {
  const businessName = useDiagnosticStore((s) => s.businessName);
  const report = useDiagnosticStore((s) => s.report);
  const workspacePlan = useDiagnosticStore((s) => s.workspacePlan);
  const { tasks, reminders, appointments, checklist } = useWorkspaceStore();

  const moduleIds = workspacePlan?.moduleIds ?? [];
  const today = new Date();

  const openTasksToday = tasks.filter((t) => !t.done && (isSameDay(t.dueDate, today) || (t.dueDate && new Date(t.dueDate) < today))).length;
  const openReminders = reminders.filter((r) => !r.done).length;
  const appointmentsToday = appointments.filter((a) => isSameDay(a.date, today)).length;
  const dailyChecklist = checklist.filter((c) => c.frequency === "daily");
  const checklistDone = dailyChecklist.filter((c) => c.done).length;

  const stats = [
    moduleIds.includes("tasks") && {
      icon: ListTodo,
      label: "Tasks due today",
      value: openTasksToday,
    },
    moduleIds.includes("reminders") && {
      icon: BellRing,
      label: "Open reminders",
      value: openReminders,
    },
    moduleIds.includes("calendar") && {
      icon: CalendarCheck,
      label: "Appointments today",
      value: appointmentsToday,
    },
    moduleIds.includes("checklist") && {
      icon: ListChecks,
      label: "Checklist done",
      value: `${checklistDone}/${dailyChecklist.length}`,
    },
  ].filter(Boolean) as { icon: typeof ListTodo; label: string; value: string | number }[];

  const workers = (workspacePlan?.workerIds ?? []).map((id) => AI_WORKER_DEFINITIONS[id]);

  return (
    <div>
      <SectionHeader
        title={`Good to see you, ${businessName}`}
        description="Here's everything that matters today."
        action={report && <Badge variant="success">Health score {report.healthScore}</Badge>}
      />

      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="gap-3 py-5">
              <CardContent className="flex flex-col gap-2 px-5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <stat.icon className="size-4" />
                </span>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {workers.length > 0 && (
        <div className="mt-12">
          <SectionHeader
            title="Your AI team"
            description="Simulated for now — a preview of what they'll do once connected."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
