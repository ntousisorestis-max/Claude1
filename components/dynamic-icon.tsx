import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.CircleHelp;
  return <Icon className={className} />;
}
