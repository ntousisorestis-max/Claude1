import type {
  BusinessReport,
  BusinessType,
  FollowUpAnswer,
  FollowUpQuestion,
  WorkspacePlan,
} from "@/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

export function fetchFollowUpQuestions(input: {
  businessType: BusinessType;
  workdayDescription: string;
}) {
  return postJson<{ questions: FollowUpQuestion[] }>("/api/ai/follow-up-questions", input).then(
    (r) => r.questions
  );
}

export function fetchBusinessReport(input: {
  businessType: BusinessType;
  workdayDescription: string;
  followUpQuestions: FollowUpQuestion[];
  followUpAnswers: FollowUpAnswer[];
}) {
  return postJson<{ report: BusinessReport }>("/api/ai/business-report", input).then((r) => r.report);
}

export function fetchWorkspacePlan(input: {
  businessType: BusinessType;
  businessName: string;
  report: BusinessReport;
}) {
  return postJson<{ plan: WorkspacePlan }>("/api/ai/workspace-plan", input).then((r) => r.plan);
}
