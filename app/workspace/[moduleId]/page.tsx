"use client";

import { useParams } from "next/navigation";
import { CircleAlert } from "lucide-react";

import type { ModuleId } from "@/types";
import { MODULE_COMPONENTS } from "@/modules/module-router";
import { EmptyState } from "@/components/empty-state";

export default function WorkspaceModulePage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId as ModuleId;
  const ModuleComponent = MODULE_COMPONENTS[moduleId];

  if (!ModuleComponent) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="Module not found"
        description="This part of your workspace hasn't been set up yet."
      />
    );
  }

  return <ModuleComponent />;
}
