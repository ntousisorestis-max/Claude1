import type { PainCategory } from "./diagnostic";

export type WorkerId =
  | "customer-follow-up"
  | "invoice-assistant"
  | "email-drafter"
  | "document-summarizer"
  | "quote-generator";

export type WorkerStatus = "simulated" | "coming_soon";

export interface AIWorkerDefinition {
  id: WorkerId;
  name: string;
  purpose: string;
  status: WorkerStatus;
  icon: string;
  relevantCategories: PainCategory[];
  samplePrompt: string;
  sampleOutput: string;
  futureIntegration: string;
}
