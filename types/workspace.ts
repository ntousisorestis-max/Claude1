import type { BusinessType } from "./business";
import type { ModuleId } from "./modules";
import type { WorkerId } from "./workers";

export interface WorkspacePlan {
  businessType: BusinessType;
  businessName: string;
  moduleIds: ModuleId[];
  workerIds: WorkerId[];
  rationale: Partial<Record<ModuleId, string>>;
  createdAt: string;
}

export type Priority = "low" | "medium" | "high";

export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags: string[];
  lastContact?: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
  relatedTo?: string;
}

export type DocumentType = "invoice" | "contract" | "receipt" | "other";
export type DocumentStatus = "draft" | "sent" | "paid" | "overdue";

export interface DocumentItem {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  amount?: number;
  date: string;
}

export type ChecklistFrequency = "daily" | "weekly" | "none";

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  frequency: ChecklistFrequency;
}

export interface Appointment {
  id: string;
  title: string;
  customerName?: string;
  date: string;
  time: string;
  durationMinutes: number;
  notes?: string;
}

export type EmailCategory = "lead" | "support" | "billing";

export interface EmailMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  category: EmailCategory;
  receivedAgo: string;
  replied: boolean;
  /** Keys into the draft builders in lib/mock-data/email-data.ts. */
  draftId: string;
}

export type DraftVariant = "default" | "shorter" | "formal" | "discount";

/** What the owner teaches the assistant about their business — drafts are grounded in this. */
export interface BusinessKnowledgeBase {
  pricing: string;
  hours: string;
  notes: string;
}

export interface WorkspaceData {
  tasks: TaskItem[];
  customers: Customer[];
  notes: Note[];
  reminders: Reminder[];
  documents: DocumentItem[];
  checklist: ChecklistItem[];
  appointments: Appointment[];
  emails: EmailMessage[];
}
