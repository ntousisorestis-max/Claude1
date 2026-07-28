"use client";

import * as React from "react";
import { NotebookPen, Pin, Plus, Trash2 } from "lucide-react";

import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function NotesModule() {
  const { notes, addNote, togglePinNote, removeNote } = useWorkspaceStore();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  function handleAdd() {
    if (!title.trim() && !body.trim()) return;
    addNote(title.trim() || "Untitled note", body.trim());
    setTitle("");
    setBody("");
    setOpen(false);
  }

  const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div>
      <SectionHeader
        title="Notes"
        description="Stop losing things in chat threads."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                New note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New note</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="note-title" className="mb-2">
                    Title
                  </Label>
                  <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                </div>
                <div>
                  <Label htmlFor="note-body" className="mb-2">
                    Note
                  </Label>
                  <Textarea id="note-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd}>Save note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet" description="Jot down anything worth remembering." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((note) => (
            <Card key={note.id} className="gap-2 py-4">
              <CardContent className="px-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{note.title}</p>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePinNote(note.id)}
                      aria-label="Pin note"
                    >
                      <Pin className={cn("size-4", note.pinned && "fill-primary text-primary")} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeNote(note.id)} aria-label="Delete note">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{note.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
