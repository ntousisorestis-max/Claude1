"use client";

import * as React from "react";
import { BellRing, Plus, Trash2 } from "lucide-react";

import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RemindersModule() {
  const { reminders, addReminder, toggleReminder, removeReminder } = useWorkspaceStore();
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState(todayIsoDate());

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addReminder(title.trim(), new Date(dueDate).toISOString());
    setTitle("");
  }

  const sorted = [...reminders].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div>
      <SectionHeader title="Reminder Center" description="Never forget a follow-up again." />

      <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Remind me to..."
          className="sm:flex-1"
        />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="sm:w-44" />
        <Button type="submit" disabled={!title.trim()}>
          <Plus />
          Add
        </Button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState icon={BellRing} title="Nothing to remind you about" description="Add a reminder above." />
      ) : (
        <ul className="space-y-2">
          {sorted.map((reminder) => (
            <li
              key={reminder.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
            >
              <Checkbox checked={reminder.done} onCheckedChange={() => toggleReminder(reminder.id)} />
              <span className={cn("flex-1 text-sm", reminder.done && "text-muted-foreground line-through")}>
                {reminder.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(reminder.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeReminder(reminder.id)}
                aria-label="Delete reminder"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
