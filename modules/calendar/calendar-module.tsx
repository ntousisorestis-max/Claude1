"use client";

import * as React from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

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

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CalendarModule() {
  const { appointments, addAppointment, removeAppointment } = useWorkspaceStore();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [date, setDate] = React.useState(todayIsoDate());
  const [time, setTime] = React.useState("09:00");

  function handleAdd() {
    if (!title.trim()) return;
    addAppointment({
      title: title.trim(),
      customerName: customerName.trim() || undefined,
      date: new Date(date).toISOString(),
      time,
      durationMinutes: 60,
    });
    setTitle("");
    setCustomerName("");
    setOpen(false);
  }

  const grouped = React.useMemo(() => {
    const groups = new Map<string, typeof appointments>();
    const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    for (const appt of sorted) {
      const key = new Date(appt.date).toDateString();
      groups.set(key, [...(groups.get(key) ?? []), appt]);
    }
    return groups;
  }, [appointments]);

  return (
    <div>
      <SectionHeader
        title="Calendar"
        description="Appointments and bookings in one place."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                Add appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add an appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="appt-title" className="mb-2">
                    Title
                  </Label>
                  <Input id="appt-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                </div>
                <div>
                  <Label htmlFor="appt-customer" className="mb-2">
                    Customer (optional)
                  </Label>
                  <Input id="appt-customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="appt-date" className="mb-2">
                      Date
                    </Label>
                    <Input id="appt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="appt-time" className="mb-2">
                      Time
                    </Label>
                    <Input id="appt-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} disabled={!title.trim()}>
                  Save appointment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing on the calendar"
          description="Appointments you add will be grouped by day here."
        />
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([day, items]) => (
            <div key={day}>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {new Date(day).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <ul className="space-y-2">
                {items.map((appt) => (
                  <li
                    key={appt.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <span className="w-16 shrink-0 text-sm font-medium text-muted-foreground">{appt.time}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{appt.title}</p>
                      {appt.customerName && (
                        <p className="text-xs text-muted-foreground">{appt.customerName}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAppointment(appt.id)}
                      aria-label="Delete appointment"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
