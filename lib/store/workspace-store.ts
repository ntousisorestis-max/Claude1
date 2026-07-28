import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  Appointment,
  BusinessType,
  ChecklistFrequency,
  Customer,
  DocumentStatus,
  DocumentType,
  Note,
  Priority,
  WorkspaceData,
} from "@/types";
import { buildSeedWorkspaceData } from "@/lib/modules/seed-data";

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const emptyWorkspaceData: WorkspaceData = {
  tasks: [],
  customers: [],
  notes: [],
  reminders: [],
  documents: [],
  checklist: [],
  appointments: [],
};

interface WorkspaceState extends WorkspaceData {
  seeded: boolean;
  seedIfEmpty: (businessType: BusinessType) => void;
  resetWorkspace: () => void;

  addTask: (title: string, priority: Priority, dueDate?: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;

  addCustomer: (data: Omit<Customer, "id" | "tags"> & { tags?: string[] }) => void;
  removeCustomer: (id: string) => void;

  addNote: (title: string, body: string) => void;
  updateNote: (id: string, data: Partial<Pick<Note, "title" | "body">>) => void;
  togglePinNote: (id: string) => void;
  removeNote: (id: string) => void;

  addReminder: (title: string, dueDate: string) => void;
  toggleReminder: (id: string) => void;
  removeReminder: (id: string) => void;

  addDocument: (title: string, type: DocumentType, amount?: number) => void;
  updateDocumentStatus: (id: string, status: DocumentStatus) => void;
  removeDocument: (id: string) => void;

  addChecklistItem: (title: string, frequency: ChecklistFrequency) => void;
  toggleChecklistItem: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  resetDailyChecklist: () => void;

  addAppointment: (data: Omit<Appointment, "id">) => void;
  removeAppointment: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...emptyWorkspaceData,
      seeded: false,

      seedIfEmpty: (businessType) =>
        set((state) => (state.seeded ? state : { ...buildSeedWorkspaceData(businessType), seeded: true })),

      resetWorkspace: () => set({ ...emptyWorkspaceData, seeded: false }),

      addTask: (title, priority, dueDate) =>
        set((state) => ({
          tasks: [
            { id: generateId("task"), title, priority, dueDate, done: false, createdAt: new Date().toISOString() },
            ...state.tasks,
          ],
        })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      addCustomer: (data) =>
        set((state) => ({
          customers: [{ id: generateId("customer"), tags: [], ...data }, ...state.customers],
        })),
      removeCustomer: (id) =>
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) })),

      addNote: (title, body) =>
        set((state) => ({
          notes: [
            { id: generateId("note"), title, body, pinned: false, updatedAt: new Date().toISOString() },
            ...state.notes,
          ],
        })),
      updateNote: (id, data) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
          ),
        })),
      togglePinNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        })),
      removeNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),

      addReminder: (title, dueDate) =>
        set((state) => ({
          reminders: [{ id: generateId("reminder"), title, dueDate, done: false }, ...state.reminders],
        })),
      toggleReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)),
        })),
      removeReminder: (id) =>
        set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) })),

      addDocument: (title, type, amount) =>
        set((state) => ({
          documents: [
            { id: generateId("document"), title, type, amount, status: "draft", date: new Date().toISOString() },
            ...state.documents,
          ],
        })),
      updateDocumentStatus: (id, status) =>
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, status } : d)),
        })),
      removeDocument: (id) =>
        set((state) => ({ documents: state.documents.filter((d) => d.id !== id) })),

      addChecklistItem: (title, frequency) =>
        set((state) => ({
          checklist: [...state.checklist, { id: generateId("checklist"), title, frequency, done: false }],
        })),
      toggleChecklistItem: (id) =>
        set((state) => ({
          checklist: state.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
        })),
      removeChecklistItem: (id) =>
        set((state) => ({ checklist: state.checklist.filter((c) => c.id !== id) })),
      resetDailyChecklist: () =>
        set((state) => ({
          checklist: state.checklist.map((c) => (c.frequency === "daily" ? { ...c, done: false } : c)),
        })),

      addAppointment: (data) =>
        set((state) => ({
          appointments: [{ id: generateId("appointment"), ...data }, ...state.appointments],
        })),
      removeAppointment: (id) =>
        set((state) => ({ appointments: state.appointments.filter((a) => a.id !== id) })),
    }),
    { name: "fixmybusiness-workspace" }
  )
);
