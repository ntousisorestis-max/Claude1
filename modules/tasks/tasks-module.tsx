"use client";

import * as React from "react";
import { ListTodo, Plus, Trash2 } from "lucide-react";

import type { Priority } from "@/types";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANT: Record<Priority, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export function TasksModule() {
  const { tasks, addTask, toggleTask, removeTask } = useWorkspaceStore();
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [filter, setFilter] = React.useState<"all" | "open" | "done">("open");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim(), priority);
    setTitle("");
  }

  const filtered = tasks.filter((t) => (filter === "all" ? true : filter === "open" ? !t.done : t.done));

  return (
    <div>
      <SectionHeader title="Tasks" description="What needs to get done, and by who." />

      <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="sm:flex-1"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low priority</SelectItem>
            <SelectItem value="medium">Medium priority</SelectItem>
            <SelectItem value="high">High priority</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!title.trim()}>
          <Plus />
          Add
        </Button>
      </form>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Nothing here"
          description="Tasks you add will show up here — try adding one above."
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
            >
              <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} />
              <span className={cn("flex-1 text-sm", task.done && "text-muted-foreground line-through")}>
                {task.title}
              </span>
              <Badge variant={PRIORITY_VARIANT[task.priority]} className="capitalize">
                {task.priority}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTask(task.id)}
                aria-label="Delete task"
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
