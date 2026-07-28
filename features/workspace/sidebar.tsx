"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ModuleId } from "@/types";
import { getModule } from "@/lib/modules/registry";
import { DynamicIcon } from "@/components/dynamic-icon";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function WorkspaceSidebar({
  moduleIds,
  onNavigate,
}: {
  moduleIds: ModuleId[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Logo href="/workspace/dashboard" className="px-2" />
      <nav className="flex flex-1 flex-col gap-1">
        {moduleIds.map((moduleId) => {
          const moduleDef = getModule(moduleId);
          const href = `/workspace/${moduleId}`;
          const isActive = pathname === href;
          return (
            <Link
              key={moduleId}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <DynamicIcon name={moduleDef.icon} className="size-4" />
              {moduleDef.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
