"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BellRing, CalendarDays, ListChecks, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-16 px-6 pt-20 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-28">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6">
              Your AI business consultant
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            What keeps going wrong in your business?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty"
          >
            Describe your biggest frustrations. Our AI discovers what&apos;s wasting your time and
            builds a workspace that helps fix it — no setup, no tech jargon, just less stress.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Button size="lg" asChild>
              <Link href="/diagnostic">
                Start free
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/example">See example</Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            Takes about 3 minutes. No credit card, no commitment.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Card className="border-border/60 shadow-xl">
              <div className="flex items-center justify-between px-6">
                <p className="text-sm font-medium text-muted-foreground">Your workspace</p>
                <Badge variant="success">Health score 82</Badge>
              </div>
              <div className="grid gap-3 px-6">
                <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <BellRing className="size-4" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">3 follow-ups waiting</p>
                    <p className="text-muted-foreground">Customers you haven&apos;t replied to</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <CalendarDays className="size-4" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">4 appointments today</p>
                    <p className="text-muted-foreground">Next one at 2:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <ListChecks className="size-4" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">Opening checklist done</p>
                    <p className="text-muted-foreground">Completed at 8:41 AM</p>
                  </div>
                </div>
              </div>
              <div className="mx-6 flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
                <TrendingUp className="size-4" />
                Estimated 6 hours saved this week
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
