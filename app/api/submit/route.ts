import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RISK_LEVELS = ["Low", "Moderate", "High", "Critical"] as const;

const QuestionnaireSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254).transform((s) => s.toLowerCase()),
  machine_type: z.string().max(100),
  mac_year: z.string().max(50),
  macos_version: z.string().max(50),
  filevault_enabled: z.string().max(50),
  backup_status: z.string().max(100),
  last_backup: z.string().max(100),
  security_software: z.string().max(100),
  data_types: z.array(z.string().max(100)).max(20),
  public_wifi: z.string().max(50),
  sharing: z.string().max(200),
  priority_areas: z.array(z.string().max(100)).max(20),
  it_management: z.string().max(100),
  past_issues: z.array(z.string().max(100)).max(20),
  security_warnings: z.string().max(100),
  repair_history: z.string().max(100),
  business_use: z.string().max(100),
  client_data: z.string().max(100),
  popia_awareness: z.string().max(100),
  audit_required: z.string().max(100),
  risk_score: z.number().int().min(0).max(100),
  risk_level: z.enum(RISK_LEVELS),
});

const MAX_BODY_BYTES = 32_768;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json." },
        { status: 415 }
      );
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Request body too large." },
        { status: 413 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const result = QuestionnaireSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("[questionnaire/submit] validation failed", result.error.issues);
      return NextResponse.json(
        { success: false, error: "Validation failed.", issues: result.error.issues },
        { status: 422 }
      );
    }
    const body = result.data;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.zasupport.com";
    const token = process.env.AGENT_AUTH_TOKEN;

    let savedResponse = null;
    let saveError: string | null = null;

    if (token) {
      try {
        const upstream = await fetch(
          `${apiUrl}/api/v1/questionnaire/responses`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          }
        );

        if (upstream.ok) {
          savedResponse = await upstream.json();
        } else {
          const errText = await upstream.text();
          saveError = `Backend responded ${upstream.status}: ${errText}`;
          console.error("[questionnaire/submit] backend error:", saveError);
        }
      } catch (err) {
        saveError = err instanceof Error ? err.message : String(err);
        console.error("[questionnaire/submit] fetch error:", saveError);
      }
    } else {
      saveError = "AGENT_AUTH_TOKEN not configured — response not persisted to backend.";
      console.warn("[questionnaire/submit]", saveError);
    }

    return NextResponse.json(
      {
        success: true,
        saved: savedResponse !== null,
        save_error: saveError,
        response: savedResponse ?? body,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[questionnaire/submit] handler error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }
}
