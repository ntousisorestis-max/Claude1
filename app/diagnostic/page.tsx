"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { BusinessType, FollowUpAnswer } from "@/types";
import { useDiagnosticStore } from "@/lib/store/diagnostic-store";
import { fetchBusinessReport, fetchFollowUpQuestions } from "@/lib/ai/client";
import { ProgressHeader } from "@/features/diagnostic/progress-header";
import { BusinessTypeStep } from "@/features/diagnostic/business-type-step";
import { WorkdayStep } from "@/features/diagnostic/workday-step";
import { FollowUpStep } from "@/features/diagnostic/followup-step";
import { Generating } from "@/features/diagnostic/generating";

type Phase = "business-type" | "workday" | "loading-questions" | "followups" | "generating-report";

export default function DiagnosticPage() {
  const router = useRouter();
  const store = useDiagnosticStore();
  const [phase, setPhase] = React.useState<Phase>("business-type");
  const [followUpIndex, setFollowUpIndex] = React.useState(0);

  function handleBusinessType(businessType: BusinessType, otherLabel?: string) {
    store.setBusinessType(businessType, otherLabel);
    setPhase("workday");
  }

  async function handleWorkday(description: string) {
    if (!store.businessType) return;
    store.setWorkdayDescription(description);
    setPhase("loading-questions");
    try {
      const questions = await fetchFollowUpQuestions({
        businessType: store.businessType,
        workdayDescription: description,
      });
      store.setFollowUpQuestions(questions);
      setFollowUpIndex(0);
      setPhase("followups");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setPhase("workday");
    }
  }

  async function handleAnswer(answer: FollowUpAnswer) {
    store.setFollowUpAnswer(answer);
    const isLast = followUpIndex === store.followUpQuestions.length - 1;

    if (!isLast) {
      setFollowUpIndex((i) => i + 1);
      return;
    }

    if (!store.businessType || !store.workdayDescription) return;

    setPhase("generating-report");
    const allAnswers = [
      ...store.followUpAnswers.filter((a) => a.questionId !== answer.questionId),
      answer,
    ];

    try {
      const report = await fetchBusinessReport({
        businessType: store.businessType,
        workdayDescription: store.workdayDescription,
        followUpQuestions: store.followUpQuestions,
        followUpAnswers: allAnswers,
      });
      store.setReport(report);
      router.push("/report");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setPhase("followups");
    }
  }

  const totalSteps = 3;
  const stepNumber = phase === "business-type" ? 1 : phase === "workday" ? 2 : 3;
  const subProgress =
    phase === "followups" && store.followUpQuestions.length > 0
      ? followUpIndex / store.followUpQuestions.length
      : 0;
  const percent = Math.min(100, (((stepNumber - 1) + subProgress) / totalSteps) * 100 + 8);

  const label =
    phase === "business-type"
      ? "Step 1 of 3"
      : phase === "workday"
        ? "Step 2 of 3"
        : phase === "generating-report"
          ? "Almost done"
          : `Step 3 of 3`;

  return (
    <div className="flex min-h-screen flex-col">
      <ProgressHeader
        label={label}
        percent={percent}
        onBack={
          phase === "workday"
            ? () => setPhase("business-type")
            : phase === "followups" && followUpIndex === 0
              ? () => setPhase("workday")
              : undefined
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        {phase === "business-type" && <BusinessTypeStep onContinue={handleBusinessType} />}
        {phase === "workday" && <WorkdayStep isSubmitting={false} onContinue={handleWorkday} />}
        {phase === "loading-questions" && <Generating />}
        {phase === "followups" && store.followUpQuestions[followUpIndex] && (
          <FollowUpStep
            key={store.followUpQuestions[followUpIndex].id}
            question={store.followUpQuestions[followUpIndex]}
            index={followUpIndex}
            total={store.followUpQuestions.length}
            isSubmitting={false}
            onAnswer={handleAnswer}
          />
        )}
        {phase === "generating-report" && <Generating />}
      </main>
    </div>
  );
}
