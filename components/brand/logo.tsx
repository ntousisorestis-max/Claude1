import Link from "next/link";
import { Sparkle } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Sparkle className="size-4" fill="currentColor" />
      </span>
      <span>FixMyBusiness</span>
    </Link>
  );
}
