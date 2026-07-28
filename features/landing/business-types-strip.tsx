import { BUSINESS_TYPE_OPTIONS } from "@/types";
import { DynamicIcon } from "@/components/dynamic-icon";
import { FadeIn } from "@/components/motion/fade-in";

export function BusinessTypesStrip() {
  return (
    <section className="border-y border-border/60 bg-secondary/40 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Built for real businesses like yours</p>
        </FadeIn>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {BUSINESS_TYPE_OPTIONS.filter((o) => o.id !== "other").map((option, index) => (
            <FadeIn key={option.id} delay={index * 0.03}>
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm">
                <DynamicIcon name={option.icon} className="size-4 text-primary" />
                {option.label}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
