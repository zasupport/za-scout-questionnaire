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
  popia_consent: z.literal(true),
  risk_score: z.number().int().min(0).max(100),
  risk_level: z.enum(RISK_LEVELS),
});

const MAX_BODY_BYTES = 32_768;

// Per-instance sliding-window rate limit. Works across requests served by the
// same warm Lambda (typical Vercel instance lifetime ~15 min). Cross-instance
// protection requires a shared store — see comment below.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

type RateRecord = { count: number; resetAt: number };
const rateHits = new Map<string, RateRecord>();

function rateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const rec = rateHits.get(key);
  if (!rec || rec.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateHits.set(key, { count: 1, resetAt });
    if (rateHits.size > 1024) {
      for (const [k, v] of rateHits) if (v.resetAt <= now) rateHits.delete(k);
    }
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }
  rec.count++;
  if (rec.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: rec.resetAt };
  }
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - rec.count,
    resetAt: rec.resetAt,
  };
}

function clientKey(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const ipKey = clientKey(request);
    const rl = rateLimit(ipKey);
    const rateHeaders = {
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
    };
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please wait a minute and try again.",
        },
        {
          status: 429,
          headers: {
            ...rateHeaders,
            "Retry-After": String(
              Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
            ),
          },
        }
      );
    }

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
      { status: 200, headers: rateHeaders }
    );
  } catch (err) {
    console.error("[questionnaire/submit] handler error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }
}
