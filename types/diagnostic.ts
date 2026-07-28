import type { BusinessType } from "./business";

export type PainCategory =
  | "invoicing"
  | "scheduling"
  | "customer_communication"
  | "employee_management"
  | "inventory"
  | "reviews_reputation"
  | "owner_overload"
  | "record_keeping";

export interface FollowUpOption {
  id: string;
  label: string;
}

export interface FollowUpQuestion {
  id: string;
  category: PainCategory;
  context?: string;
  prompt: string;
  options: FollowUpOption[];
  allowOther?: boolean;
}

export interface FollowUpAnswer {
  questionId: string;
  selectedOptionId: string;
  otherText?: string;
}

export interface DiagnosticIntake {
  businessType: BusinessType;
  otherBusinessLabel?: string;
  workdayDescription: string;
}

export interface DiagnosticSession extends DiagnosticIntake {
  followUpQuestions: FollowUpQuestion[];
  followUpAnswers: FollowUpAnswer[];
}
