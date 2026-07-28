"use client";

import * as React from "react";
import { ClipboardCheck, Plus, RotateCcw, Trash2 } from "lucide-react";

import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ChecklistModule() {
  const { checklist, addChecklistItem, toggleChecklistItem, removeChecklistItem, resetDailyChecklist } =
    useWorkspaceStore();
  const [title, setTitle] = React.useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addChecklistItem(title.trim(), "daily");
    setTitle("");
  }

  const done = checklist.filter((c) => c.done).length;
  const percent = checklist.length ? Math.round((done / checklist.length) * 100) : 0;

  return (
    <div>
      <SectionHeader
        title="Daily Checklist"
        description="The routine that keeps things running."
        action={
          checklist.length > 0 && (
            <Button variant="outline" size="sm" onClick={resetDailyChecklist}>
              <RotateCcw />
              Reset for today
            </Button>
          )
        }
      />

      {checklist.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <Progress value={percent} className="flex-1" />
          <span className="text-sm font-medium text-muted-foreground">
            {done}/{checklist.length}
          </span>
        </div>
      )}

      <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a checklist item..."
          className="sm:flex-1"
        />
        <Button type="submit" disabled={!title.trim()}>
          <Plus />
          Add
        </Button>
      </form>

      {checklist.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No checklist items yet"
          description="Build the routine your team follows every day."
        />
      ) : (
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
            >
              <Checkbox checked={item.done} onCheckedChange={() => toggleChecklistItem(item.id)} />
              <span className={cn("flex-1 text-sm", item.done && "text-muted-foreground line-through")}>
                {item.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeChecklistItem(item.id)}
                aria-label="Delete item"
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
