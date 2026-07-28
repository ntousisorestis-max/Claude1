"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkle } from "lucide-react";

import type { FollowUpAnswer, FollowUpQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const OTHER_OPTION_ID = "__other__";

export function FollowUpStep({
  question,
  index,
  total,
  isSubmitting,
  onAnswer,
}: {
  question: FollowUpQuestion;
  index: number;
  total: number;
  isSubmitting: boolean;
  onAnswer: (answer: FollowUpAnswer) => void;
}) {
  // The parent renders this component with `key={question.id}`, so a new
  // question always mounts a fresh instance — no effect needed to reset
  // this local state.
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [otherText, setOtherText] = React.useState("");

  const isLast = index === total - 1;
  const canSubmit = selectedId && (selectedId !== OTHER_OPTION_ID || otherText.trim().length > 0);

  function handleSubmit() {
    if (!canSubmit) return;
    onAnswer({
      questionId: question.id,
      selectedOptionId: selectedId === OTHER_OPTION_ID ? "other" : selectedId,
      otherText: selectedId === OTHER_OPTION_ID ? otherText.trim() : undefined,
    });
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkle className="size-4" fill="currentColor" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Question {index + 1} of {total}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl text-balance">
              {question.prompt}
            </h1>
          </div>
        </div>

        <RadioGroup value={selectedId} onValueChange={setSelectedId} className="mt-8 ml-11">
          {question.options.map((option) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card p-4 font-normal transition-colors hover:border-primary/50",
                selectedId === option.id && "border-primary bg-accent/50 ring-2 ring-primary/30"
              )}
            >
              <RadioGroupItem value={option.id} id={option.id} />
              {option.label}
            </Label>
          ))}
          {question.allowOther && (
            <Label
              htmlFor={OTHER_OPTION_ID}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card p-4 font-normal transition-colors hover:border-primary/50",
                selectedId === OTHER_OPTION_ID && "border-primary bg-accent/50 ring-2 ring-primary/30"
              )}
            >
              <RadioGroupItem value={OTHER_OPTION_ID} id={OTHER_OPTION_ID} />
              Other
            </Label>
          )}
        </RadioGroup>

        {selectedId === OTHER_OPTION_ID && (
          <div className="mt-3 ml-11">
            <Input
              autoFocus
              placeholder="Tell us more..."
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
            />
          </div>
        )}

        <div className="mt-8 ml-11 flex justify-end">
          <Button disabled={!canSubmit || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Building your report...
              </>
            ) : (
              <>
                {isLast ? "See my report" : "Next"}
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
