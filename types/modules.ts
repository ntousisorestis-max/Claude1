export type ModuleId =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "customers"
  | "email"
  | "notes"
  | "reminders"
  | "documents"
  | "checklist"
  | "reports"
  | "settings";

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  tagline: string;
  icon: string;
  /** Always included regardless of diagnostic results. */
  core?: boolean;
}
