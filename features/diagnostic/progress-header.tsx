"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/brand/logo";

export function ProgressHeader({
  label,
  percent,
  onBack,
}: {
  label: string;
  percent: number;
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-6">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
            <ArrowLeft />
          </Button>
        ) : (
          <Logo href="/" className="text-sm" />
        )}
        <div className="flex-1">
          <Progress value={percent} className="h-1.5" />
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{label}</span>
      </div>
    </header>
  );
}
