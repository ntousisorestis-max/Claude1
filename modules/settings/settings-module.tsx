"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getBusinessTypeOption } from "@/types";
import { AI_WORKER_DEFINITIONS, WORKER_ORDER } from "@/lib/workers/registry";
import { INTEGRATION_DEFINITIONS, INTEGRATION_ORDER, getIntegrationClient } from "@/services/integrations/registry";
import { useDiagnosticStore } from "@/lib/store/diagnostic-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { DynamicIcon } from "@/components/dynamic-icon";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function SettingsModule() {
  const router = useRouter();
  const { businessType, businessName, setBusinessName, workspacePlan, toggleWorker, reset } =
    useDiagnosticStore();
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);
  const seedIfEmpty = useWorkspaceStore((s) => s.seedIfEmpty);

  async function handleConnect(name: string, id: Parameters<typeof getIntegrationClient>[0]) {
    try {
      await getIntegrationClient(id).connect("demo-business");
    } catch (error) {
      toast(`${name} isn't connected yet`, {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  function handleResetDemoData() {
    resetWorkspace();
    if (businessType) seedIfEmpty(businessType);
    toast.success("Demo data reset.");
  }

  function handleStartOver() {
    reset();
    resetWorkspace();
    router.push("/");
  }

  return (
    <div className="space-y-12">
      <div>
        <SectionHeader title="Settings" description="Business profile and connections." />

        <Card>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Label htmlFor="settings-business-name" className="mb-2">
                Business name
              </Label>
              <Input
                id="settings-business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            {businessType && (
              <div>
                <Label className="mb-2">Business type</Label>
                <div>
                  <Badge variant="secondary">{getBusinessTypeOption(businessType).label}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader
          title="Your AI team"
          description="Turn workers on or off. All are simulated in this version."
        />
        <Card>
          <CardContent className="divide-y divide-border">
            {WORKER_ORDER.map((id) => {
              const worker = AI_WORKER_DEFINITIONS[id];
              const enabled = workspacePlan?.workerIds.includes(id) ?? false;
              return (
                <div key={id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <DynamicIcon name={worker.icon} className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{worker.name}</p>
                    <p className="text-xs text-muted-foreground">{worker.purpose}</p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={() => toggleWorker(id)} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader title="Connections" description="Coming soon — connect the tools you already use." />
        <div className="grid gap-3 sm:grid-cols-2">
          {INTEGRATION_ORDER.map((id) => {
            const integration = INTEGRATION_DEFINITIONS[id];
            return (
              <Card key={id} className="gap-3 py-4">
                <CardContent className="flex items-start gap-3 px-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <DynamicIcon name={integration.icon} className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleConnect(integration.name, id)}>
                    Connect
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeader title="Demo controls" description="Only visible in this preview build." />
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Reset demo data</p>
              <p className="text-xs text-muted-foreground">Restores the sample tasks, customers, and notes.</p>
            </div>
            <Button variant="outline" onClick={handleResetDemoData}>
              Reset demo data
            </Button>
          </CardContent>
          <Separator />
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Start over</p>
              <p className="text-xs text-muted-foreground">
                Clears everything and takes you back to the beginning.
              </p>
            </div>
            <Button variant="destructive" onClick={handleStartOver}>
              Start over
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
