import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getAIProvider } from "@/lib/ai";
import { businessReportRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = businessReportRequestSchema.parse(await request.json());
    const report = await getAIProvider().generateBusinessReport(body);
    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("[ai/business-report]", error);
    return NextResponse.json(
      { error: "We couldn't put your report together right now. Please try again." },
      { status: 500 }
    );
  }
}
