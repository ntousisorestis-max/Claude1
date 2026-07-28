import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getAIProvider } from "@/lib/ai";
import { followUpQuestionsRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = followUpQuestionsRequestSchema.parse(await request.json());
    const questions = await getAIProvider().generateFollowUpQuestions(body);
    return NextResponse.json({ questions });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("[ai/follow-up-questions]", error);
    return NextResponse.json(
      { error: "We couldn't come up with follow-up questions right now. Please try again." },
      { status: 500 }
    );
  }
}
