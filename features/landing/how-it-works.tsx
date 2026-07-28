import { ClipboardList, MessagesSquare, LayoutDashboard, Sparkles } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Tell us about your day",
    description: "Pick your type of business and describe a normal workday, in your own words.",
  },
  {
    icon: MessagesSquare,
    title: "Answer a few smart questions",
    description: "We ask 3–5 quick questions to get to the real root cause — not a long survey.",
  },
  {
    icon: Sparkles,
    title: "Get your business report",
    description: "A clear, honest look at what's costing you time and money — and why.",
  },
  {
    icon: LayoutDashboard,
    title: "Your workspace is ready",
    description: "We build a workspace with only the tools you actually need. Nothing to configure.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          It feels like hiring a consultant, not configuring software
        </h2>
        <p className="mt-4 text-muted-foreground text-pretty">
          Four simple steps, about three minutes, zero technical decisions.
        </p>
      </FadeIn>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <FadeIn key={step.title} delay={index * 0.08}>
            <div className="h-full rounded-2xl border border-border/60 bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-medium text-muted-foreground">Step {index + 1}</p>
              <h3 className="mt-1 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">{step.description}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
