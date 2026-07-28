import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getAIProvider } from "@/lib/ai";
import { workspacePlanRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = workspacePlanRequestSchema.parse(await request.json());
    const plan = await getAIProvider().generateWorkspacePlan(body);
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("[ai/workspace-plan]", error);
    return NextResponse.json(
      { error: "We couldn't build your workspace right now. Please try again." },
      { status: 500 }
    );
  }
}
