"use client";

import * as React from "react";
import { FileText, Plus, Trash2 } from "lucide-react";

import type { DocumentStatus, DocumentType } from "@/types";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS: DocumentStatus[] = ["draft", "sent", "paid", "overdue"];

export function DocumentsModule() {
  const { documents, addDocument, updateDocumentStatus, removeDocument } = useWorkspaceStore();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<DocumentType>("invoice");
  const [amount, setAmount] = React.useState("");

  function handleAdd() {
    if (!title.trim()) return;
    addDocument(title.trim(), type, amount ? Number(amount) : undefined);
    setTitle("");
    setAmount("");
    setOpen(false);
  }

  return (
    <div>
      <SectionHeader
        title="Documents"
        description="Invoices, quotes, and paperwork — all in one place."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                Add document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a document</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="doc-title" className="mb-2">
                    Title
                  </Label>
                  <Input
                    id="doc-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Invoice #205 — Acme Co."
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="doc-type" className="mb-2">
                      Type
                    </Label>
                    <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
                      <SelectTrigger id="doc-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doc-amount" className="mb-2">
                      Amount (optional)
                    </Label>
                    <Input
                      id="doc-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} disabled={!title.trim()}>
                  Save document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Invoices, quotes, and receipts you add will show up here."
        />
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
            >
              <FileText className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{doc.title}</span>
              {doc.amount !== undefined && (
                <span className="text-sm text-muted-foreground">${doc.amount.toFixed(2)}</span>
              )}
              <Select value={doc.status} onValueChange={(v) => updateDocumentStatus(doc.id, v as DocumentStatus)}>
                <SelectTrigger size="sm" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} aria-label="Delete document">
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
