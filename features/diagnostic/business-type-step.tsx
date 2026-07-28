"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { BUSINESS_TYPE_OPTIONS, type BusinessType } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function BusinessTypeStep({
  onContinue,
}: {
  onContinue: (businessType: BusinessType, otherLabel?: string) => void;
}) {
  const [selected, setSelected] = React.useState<BusinessType | null>(null);
  const [otherLabel, setOtherLabel] = React.useState("");

  function handleSelect(id: BusinessType) {
    setSelected(id);
    if (id !== "other") {
      onContinue(id);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">What kind of business is it?</h1>
      <p className="mt-2 text-muted-foreground">Pick the closest match — we&apos;ll tailor everything from here.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BUSINESS_TYPE_OPTIONS.map((option, index) => (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className={cn(
              "flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50",
              selected === option.id && "border-primary bg-accent/60 ring-2 ring-primary/30"
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <DynamicIcon name={option.icon} className="size-4" />
            </span>
            <span className="font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.blurb}</span>
          </motion.button>
        ))}
      </div>

      {selected === "other" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <Input
            autoFocus
            placeholder="What kind of business do you run?"
            value={otherLabel}
            onChange={(e) => setOtherLabel(e.target.value)}
            className="sm:flex-1"
          />
          <Button disabled={!otherLabel.trim()} onClick={() => onContinue("other", otherLabel.trim())}>
            Continue
            <ArrowRight />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
