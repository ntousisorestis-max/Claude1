"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const schema = z.object({
  workdayDescription: z
    .string()
    .trim()
    .min(20, "Tell us a little more — a few sentences is perfect."),
});

type FormValues = z.infer<typeof schema>;

const EXAMPLE_PLACEHOLDER = `I own a plumbing business.
Customers mostly call me.
Sometimes I forget to call them back.
Invoices pile up.
Employees forget tasks.
Everything is in WhatsApp.`;

export function WorkdayStep({
  isSubmitting,
  onContinue,
}: {
  isSubmitting: boolean;
  onContinue: (description: string) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { workdayDescription: "" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Describe a normal workday</h1>
      <p className="mt-2 text-muted-foreground">
        Don&apos;t worry about getting it &quot;right&quot; — just tell us what actually happens.
      </p>

      <form
        onSubmit={form.handleSubmit((values) => onContinue(values.workdayDescription))}
        className="mt-8 space-y-3"
      >
        <Label htmlFor="workday" className="sr-only">
          Describe a normal workday
        </Label>
        <Textarea
          id="workday"
          rows={9}
          placeholder={EXAMPLE_PLACEHOLDER}
          disabled={isSubmitting}
          {...form.register("workdayDescription")}
        />
        {form.formState.errors.workdayDescription && (
          <p className="text-sm text-destructive">{form.formState.errors.workdayDescription.message}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                Continue
                <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
