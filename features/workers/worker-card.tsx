"use client";

import * as React from "react";

import type { AIWorkerDefinition } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function WorkerCard({ worker }: { worker: AIWorkerDefinition }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card className="gap-4 py-5">
      <CardContent className="flex flex-col gap-4 px-5">
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <DynamicIcon name={worker.icon} className="size-5" />
          </span>
          <Badge variant="secondary">Simulated</Badge>
        </div>
        <div>
          <h3 className="font-semibold">{worker.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{worker.purpose}</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="self-start">
              See a preview
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{worker.name}</DialogTitle>
              <DialogDescription>{worker.purpose}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-secondary p-3 text-secondary-foreground">
                <p className="text-xs font-medium text-muted-foreground">If this happened:</p>
                <p className="mt-1">{worker.samplePrompt}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-accent/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Here&apos;s what it would draft:</p>
                <p className="mt-1">{worker.sampleOutput}</p>
              </div>
              <p className="text-xs text-muted-foreground">{worker.futureIntegration}</p>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
