"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import type { ModuleId } from "@/types";
import { getModule } from "@/lib/modules/registry";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { WorkspaceSidebar } from "@/features/workspace/sidebar";
import { VisuallyHidden } from "@/components/visually-hidden";

export function WorkspaceTopbar({ moduleIds, businessName }: { moduleIds: ModuleId[]; businessName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const currentModuleId = pathname?.split("/")[2] as ModuleId | undefined;
  const currentModule = currentModuleId ? getModule(currentModuleId) : undefined;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <WorkspaceSidebar moduleIds={moduleIds} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{businessName}</p>
        <h1 className="font-semibold">{currentModule?.name ?? "Workspace"}</h1>
      </div>

      <ThemeToggle />
    </header>
  );
}
