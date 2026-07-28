import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  BusinessReport,
  BusinessType,
  FollowUpAnswer,
  FollowUpQuestion,
  WorkerId,
  WorkspacePlan,
} from "@/types";

interface DiagnosticState {
  businessType?: BusinessType;
  otherBusinessLabel?: string;
  businessName: string;
  workdayDescription?: string;
  followUpQuestions: FollowUpQuestion[];
  followUpAnswers: FollowUpAnswer[];
  report?: BusinessReport;
  workspacePlan?: WorkspacePlan;

  setBusinessType: (businessType: BusinessType, otherLabel?: string) => void;
  setBusinessName: (name: string) => void;
  setWorkdayDescription: (description: string) => void;
  setFollowUpQuestions: (questions: FollowUpQuestion[]) => void;
  setFollowUpAnswer: (answer: FollowUpAnswer) => void;
  setReport: (report: BusinessReport) => void;
  setWorkspacePlan: (plan: WorkspacePlan) => void;
  toggleWorker: (workerId: WorkerId) => void;
  reset: () => void;
}

const initialState = {
  businessType: undefined,
  otherBusinessLabel: undefined,
  businessName: "Your Business",
  workdayDescription: undefined,
  followUpQuestions: [],
  followUpAnswers: [],
  report: undefined,
  workspacePlan: undefined,
} satisfies Partial<DiagnosticState>;

export const useDiagnosticStore = create<DiagnosticState>()(
  persist(
    (set) => ({
      ...initialState,

      setBusinessType: (businessType, otherLabel) =>
        set({ businessType, otherBusinessLabel: otherLabel }),

      setBusinessName: (businessName) => set({ businessName }),

      setWorkdayDescription: (workdayDescription) => set({ workdayDescription }),

      setFollowUpQuestions: (followUpQuestions) => set({ followUpQuestions, followUpAnswers: [] }),

      setFollowUpAnswer: (answer) =>
        set((state) => ({
          followUpAnswers: [
            ...state.followUpAnswers.filter((a) => a.questionId !== answer.questionId),
            answer,
          ],
        })),

      setReport: (report) => set({ report }),

      setWorkspacePlan: (workspacePlan) => set({ workspacePlan }),

      toggleWorker: (workerId) =>
        set((state) => {
          if (!state.workspacePlan) return state;
          const isEnabled = state.workspacePlan.workerIds.includes(workerId);
          const workerIds = isEnabled
            ? state.workspacePlan.workerIds.filter((id) => id !== workerId)
            : [...state.workspacePlan.workerIds, workerId];
          return { workspacePlan: { ...state.workspacePlan, workerIds } };
        }),

      reset: () => set(initialState),
    }),
    { name: "fixmybusiness-diagnostic" }
  )
);
