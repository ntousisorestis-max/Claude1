import type {
  BusinessReport,
  BusinessType,
  FollowUpAnswer,
  FollowUpQuestion,
  WorkspacePlan,
} from "@/types";

export interface GenerateFollowUpQuestionsInput {
  businessType: BusinessType;
  workdayDescription: string;
}

export interface GenerateBusinessReportInput {
  businessType: BusinessType;
  workdayDescription: string;
  followUpQuestions: FollowUpQuestion[];
  followUpAnswers: FollowUpAnswer[];
}

export interface GenerateWorkspacePlanInput {
  businessType: BusinessType;
  businessName: string;
  report: BusinessReport;
}

/**
 * Everything the AI Business Consultant needs to do, abstracted behind one
 * interface. `SimulatedAIProvider` (deterministic, no network calls) is the
 * default so the product works with zero configuration; `OpenAIProvider`
 * implements the same contract for when a real key is available. Swapping
 * providers is a one-line change in `lib/ai/index.ts`.
 */
export interface AIProvider {
  readonly name: string;
  generateFollowUpQuestions(
    input: GenerateFollowUpQuestionsInput
  ): Promise<FollowUpQuestion[]>;
  generateBusinessReport(input: GenerateBusinessReportInput): Promise<BusinessReport>;
  generateWorkspacePlan(input: GenerateWorkspacePlanInput): Promise<WorkspacePlan>;
}
