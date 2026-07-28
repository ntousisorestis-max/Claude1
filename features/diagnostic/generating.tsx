"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkle } from "lucide-react";

const MESSAGES = [
  "Reading through what you told us...",
  "Spotting the patterns...",
  "Estimating what this is costing you...",
  "Putting your report together...",
];

export function Generating() {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <motion.span
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
      >
        <Sparkle className="size-6" fill="currentColor" />
      </motion.span>
      <p className="text-lg font-medium text-balance">{MESSAGES[messageIndex]}</p>
    </div>
  );
}
