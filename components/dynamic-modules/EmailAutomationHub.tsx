"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlignLeft,
  BookOpenCheck,
  Briefcase,
  CheckCircle2,
  Inbox,
  Percent,
  RefreshCw,
  Send,
  Sparkle,
} from "lucide-react";
import { toast } from "sonner";

import type { DraftVariant, EmailCategory, EmailMessage } from "@/types";
import { buildDraft, CATEGORY_LABELS } from "@/lib/mock-data/email-data";
import { useDiagnosticStore } from "@/lib/store/diagnostic-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const CATEGORY_BADGE_VARIANT: Record<EmailCategory, "success" | "secondary" | "warning"> = {
  lead: "success",
  support: "secondary",
  billing: "warning",
};

const REGENERATE_OPTIONS: { variant: DraftVariant; label: string; icon: typeof AlignLeft }[] = [
  { variant: "shorter", label: "Shorter", icon: AlignLeft },
  { variant: "formal", label: "More formal", icon: Briefcase },
  { variant: "discount", label: "Add discount", icon: Percent },
];

export function EmailAutomationHub() {
  const businessName = useDiagnosticStore((s) => s.businessName);
  const { emails, knowledgeBase, markEmailReplied, updateKnowledgeBase } = useWorkspaceStore();

  const openEmails = emails.filter((e) => !e.replied);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [variant, setVariant] = React.useState<DraftVariant>("default");
  const [regenerating, setRegenerating] = React.useState(false);
  const [justSentId, setJustSentId] = React.useState<string | null>(null);

  const selected: EmailMessage | undefined =
    emails.find((e) => e.id === selectedId && !e.replied) ?? openEmails[0];

  function handleSelect(email: EmailMessage) {
    setSelectedId(email.id);
    setVariant("default");
    setJustSentId(null);
  }

  function handleRegenerate(nextVariant: DraftVariant) {
    const target = variant === nextVariant ? "default" : nextVariant;
    setRegenerating(true);
    // Simulated "thinking" beat so regeneration reads as intentional work.
    window.setTimeout(() => {
      setVariant(target);
      setRegenerating(false);
    }, 550);
  }

  function handleSend(email: EmailMessage) {
    setJustSentId(email.id);
    window.setTimeout(() => {
      markEmailReplied(email.id);
      setJustSentId(null);
      setVariant("default");
      setSelectedId(null);
      toast.success(`Reply sent to ${email.fromName.split(" ")[0]}`);
    }, 1100);
  }

  const draft = selected
    ? buildDraft(selected.draftId, variant, { businessName, kb: knowledgeBase })
    : "";

  return (
    <div>
      <SectionHeader
        title="Email Automation Hub"
        description="Every email answered with a draft you approve — grounded in your business info."
        action={<KnowledgeBaseDrawer knowledgeBase={knowledgeBase} onSave={updateKnowledgeBase} />}
      />

      {openEmails.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox zero"
          description="You've replied to everything. New emails will appear here with a draft ready to go."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="space-y-2">
            <p className="px-1 text-xs font-medium text-muted-foreground">
              {openEmails.length} waiting · sorted and labeled for you
            </p>
            {openEmails.map((email) => (
              <button
                key={email.id}
                type="button"
                onClick={() => handleSelect(email)}
                className={cn(
                  "w-full rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/50",
                  selected?.id === email.id && "border-primary bg-accent/50 ring-2 ring-primary/30"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{email.fromName}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{email.receivedAgo}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium">{email.subject}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{email.body}</p>
                <div className="mt-2">
                  <Badge variant={CATEGORY_BADGE_VARIANT[email.category]}>
                    <Sparkle className="size-3" fill="currentColor" />
                    {CATEGORY_LABELS[email.category]}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="gap-4 py-5 lg:sticky lg:top-24">
              <CardContent className="px-5">
                <div className="rounded-xl bg-secondary/60 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{selected.fromName}</p>
                    <Badge variant={CATEGORY_BADGE_VARIANT[selected.category]}>
                      {CATEGORY_LABELS[selected.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.fromEmail}</p>
                  <p className="mt-3 text-sm font-medium">{selected.subject}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.body}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkle className="size-3.5 text-primary" fill="currentColor" />
                    Suggested reply, using your business info
                  </p>
                  {variant !== "default" && (
                    <Badge variant="outline" className="capitalize">
                      {variant === "discount" ? "With discount" : variant}
                    </Badge>
                  )}
                </div>

                <div className="relative mt-2 min-h-40 rounded-xl border border-primary/25 bg-accent/30 p-4">
                  {justSentId === selected.id ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="flex min-h-32 flex-col items-center justify-center gap-2 text-success"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 15, delay: 0.05 }}
                      >
                        <CheckCircle2 className="size-10" />
                      </motion.span>
                      <p className="text-sm font-semibold">Sent!</p>
                    </motion.div>
                  ) : regenerating ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/5" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <motion.p
                      key={`${selected.id}-${variant}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm whitespace-pre-line"
                    >
                      {draft}
                    </motion.p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RefreshCw className="size-3.5" />
                    Regenerate:
                  </span>
                  {REGENERATE_OPTIONS.map((option) => (
                    <Button
                      key={option.variant}
                      variant={variant === option.variant ? "secondary" : "outline"}
                      size="sm"
                      disabled={regenerating || justSentId !== null}
                      onClick={() => handleRegenerate(option.variant)}
                    >
                      <option.icon />
                      {option.label}
                    </Button>
                  ))}
                </div>

                <motion.div whileTap={{ scale: 0.97 }} className="mt-4">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={regenerating || justSentId !== null}
                    onClick={() => handleSend(selected)}
                  >
                    <Send />
                    Approve &amp; Send
                  </Button>
                </motion.div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Simulated preview — connecting your real inbox comes later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function KnowledgeBaseDrawer({
  knowledgeBase,
  onSave,
}: {
  knowledgeBase: { pricing: string; hours: string; notes: string };
  onSave: (data: { pricing: string; hours: string; notes: string }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pricing, setPricing] = React.useState(knowledgeBase.pricing);
  const [hours, setHours] = React.useState(knowledgeBase.hours);
  const [notes, setNotes] = React.useState(knowledgeBase.notes);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setPricing(knowledgeBase.pricing);
      setHours(knowledgeBase.hours);
      setNotes(knowledgeBase.notes);
    }
  }

  function handleSave() {
    onSave({ pricing: pricing.trim(), hours: hours.trim(), notes: notes.trim() });
    setOpen(false);
    toast.success("Saved — new drafts will use this right away.");
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <BookOpenCheck />
          Your business info
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your business info</SheetTitle>
          <SheetDescription>
            Replies are written from what you put here — keep it current and every draft stays accurate.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          <div>
            <Label htmlFor="kb-pricing" className="mb-2">
              Pricing
            </Label>
            <Textarea
              id="kb-pricing"
              rows={3}
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
              placeholder="Standard visit: $95. Larger jobs quoted up front."
            />
          </div>
          <div>
            <Label htmlFor="kb-hours" className="mb-2">
              Opening hours
            </Label>
            <Textarea
              id="kb-hours"
              rows={2}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Monday–Friday 8am–6pm, Saturday 9am–1pm."
            />
          </div>
          <div>
            <Label htmlFor="kb-notes" className="mb-2">
              Anything else customers ask about
            </Label>
            <Textarea
              id="kb-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Service area, payment methods, parking..."
            />
          </div>
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
