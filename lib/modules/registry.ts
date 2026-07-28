import type { ModuleDefinition, ModuleId } from "@/types";

export const MODULE_DEFINITIONS: Record<ModuleId, ModuleDefinition> = {
  dashboard: {
    id: "dashboard",
    name: "Dashboard",
    tagline: "Everything that matters, at a glance",
    icon: "LayoutDashboard",
    core: true,
  },
  tasks: {
    id: "tasks",
    name: "Tasks",
    tagline: "What needs to get done, and by who",
    icon: "ListChecks",
  },
  calendar: {
    id: "calendar",
    name: "Calendar",
    tagline: "Appointments and bookings in one place",
    icon: "CalendarDays",
  },
  customers: {
    id: "customers",
    name: "Customers",
    tagline: "Every customer, remembered",
    icon: "Users",
  },
  notes: {
    id: "notes",
    name: "Notes",
    tagline: "Stop losing things in chat threads",
    icon: "NotebookPen",
  },
  reminders: {
    id: "reminders",
    name: "Reminder Center",
    tagline: "Never forget a follow-up again",
    icon: "BellRing",
  },
  documents: {
    id: "documents",
    name: "Documents",
    tagline: "Invoices, quotes, and paperwork",
    icon: "FileText",
  },
  checklist: {
    id: "checklist",
    name: "Daily Checklist",
    tagline: "The routine that keeps things running",
    icon: "ClipboardCheck",
  },
  reports: {
    id: "reports",
    name: "Reports",
    tagline: "Your business health, over time",
    icon: "BarChart3",
  },
  settings: {
    id: "settings",
    name: "Settings",
    tagline: "Business profile and connections",
    icon: "Settings2",
    core: true,
  },
};

export const MODULE_ORDER: ModuleId[] = [
  "dashboard",
  "tasks",
  "calendar",
  "customers",
  "reminders",
  "checklist",
  "documents",
  "notes",
  "reports",
  "settings",
];

export function sortModuleIds(ids: ModuleId[]): ModuleId[] {
  const set = new Set(ids);
  return MODULE_ORDER.filter((id) => set.has(id));
}

export function getModule(id: ModuleId): ModuleDefinition {
  return MODULE_DEFINITIONS[id];
}
