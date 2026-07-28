"use client";

import * as React from "react";
import { Mail, Phone, Plus, Trash2, Users } from "lucide-react";

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

export function CustomersModule() {
  const { customers, addCustomer, removeCustomer } = useWorkspaceStore();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");

  function handleAdd() {
    if (!name.trim()) return;
    addCustomer({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined });
    setName("");
    setPhone("");
    setEmail("");
    setOpen(false);
  }

  return (
    <div>
      <SectionHeader
        title="Customers"
        description="Every customer, remembered."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                Add customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customer-name" className="mb-2">
                    Name
                  </Label>
                  <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                </div>
                <div>
                  <Label htmlFor="customer-phone" className="mb-2">
                    Phone
                  </Label>
                  <Input id="customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="customer-email" className="mb-2">
                    Email
                  </Label>
                  <Input id="customer-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} disabled={!name.trim()}>
                  Save customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start keeping track of them here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {customers.map((customer) => (
            <Card key={customer.id} className="gap-2 py-4">
              <CardContent className="flex items-start justify-between gap-2 px-4">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                    {customer.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3.5" /> {customer.phone}
                      </p>
                    )}
                    {customer.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="size-3.5" /> {customer.email}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomer(customer.id)}
                  aria-label="Remove customer"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
