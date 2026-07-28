import type { ComponentType } from "react";

import type { ModuleId } from "@/types";
import { EmailAutomationHub } from "@/components/dynamic-modules/EmailAutomationHub";
import { DashboardModule } from "./dashboard/dashboard-module";
import { TasksModule } from "./tasks/tasks-module";
import { CalendarModule } from "./calendar/calendar-module";
import { CustomersModule } from "./customers/customers-module";
import { NotesModule } from "./notes/notes-module";
import { RemindersModule } from "./reminders/reminders-module";
import { DocumentsModule } from "./documents/documents-module";
import { ChecklistModule } from "./checklist/checklist-module";
import { ReportsModule } from "./reports/reports-module";
import { SettingsModule } from "./settings/settings-module";

export const MODULE_COMPONENTS: Record<ModuleId, ComponentType> = {
  dashboard: DashboardModule,
  tasks: TasksModule,
  calendar: CalendarModule,
  customers: CustomersModule,
  email: EmailAutomationHub,
  notes: NotesModule,
  reminders: RemindersModule,
  documents: DocumentsModule,
  checklist: ChecklistModule,
  reports: ReportsModule,
  settings: SettingsModule,
};
