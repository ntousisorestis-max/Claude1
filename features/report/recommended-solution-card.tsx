import { ArrowRight, Loader2, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function RecommendedSolutionCard({
  solution,
  isLoading,
  onBuildWorkspace,
}: {
  solution: string;
  isLoading: boolean;
  onBuildWorkspace: () => void;
}) {
  return (
    <Card className="border-primary/30 bg-accent/40">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wand2 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Our recommendation</p>
            <p className="mt-1 font-medium text-pretty">{solution}</p>
          </div>
        </div>
        <Button size="lg" onClick={onBuildWorkspace} disabled={isLoading} className="shrink-0">
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Building...
            </>
          ) : (
            <>
              Build my workspace
              <ArrowRight />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
