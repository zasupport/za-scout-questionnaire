import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SEC = 60;

// ── Rate limiter: Upstash when configured, in-memory fallback otherwise ─────
//
// Tier 1 (preferred): @upstash/ratelimit + Upstash Redis REST
//   - Cross-instance protection — a hostile actor cannot escape the limit by
//     load-balancing across warm Lambdas.
//   - Set env UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN on Vercel
//     (production + preview scopes) and cold starts will pick them up.
//
// Tier 2 (fallback): in-memory sliding window
//   - Scope = single warm Lambda lifetime (~15 min on Vercel).
//   - Useful burst protection for same-instance spray; does NOT protect
//     cross-instance. Retained so the endpoint still behaves sanely if the
//     Upstash config is missing at boot.

type RateCheck = {
  allowed: boolean;
  remaining: number;
  resetAtEpochSeconds: number;
  tier: "upstash" | "memory";
};

let upstashLimiter: Ratelimit | null = null;
function buildUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter) return upstashLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  upstashLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, `${RATE_LIMIT_WINDOW_SEC} s`),
    prefix: "scout:submit",
    analytics: true,
  });
  return upstashLimiter;
}

type RateRecord = { count: number; resetAt: number };
const memoryHits = new Map<string, RateRecord>();

function inMemoryLimit(key: string): RateCheck {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_SEC * 1000;
  const rec = memoryHits.get(key);
  if (!rec || rec.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryHits.set(key, { count: 1, resetAt });
    if (memoryHits.size > 1024) {
      for (const [k, v] of memoryHits) if (v.resetAt <= now) memoryHits.delete(k);
    }
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetAtEpochSeconds: Math.ceil(resetAt / 1000),
      tier: "memory",
    };
  }
  rec.count++;
  if (rec.count > RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAtEpochSeconds: Math.ceil(rec.resetAt / 1000),
      tier: "memory",
    };
  }
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - rec.count,
    resetAtEpochSeconds: Math.ceil(rec.resetAt / 1000),
    tier: "memory",
  };
}

async function checkRateLimit(key: string): Promise<RateCheck> {
  const limiter = buildUpstashLimiter();
  if (limiter) {
    try {
      const r = await limiter.limit(key);
      return {
        allowed: r.success,
        remaining: r.remaining,
        resetAtEpochSeconds: Math.ceil(r.reset / 1000),
        tier: "upstash",
      };
    } catch (err) {
      console.warn(
        "[questionnaire/submit] Upstash ratelimit error, falling back to memory:",
        err instanceof Error ? err.message : err
      );
      return inMemoryLimit(key);
    }
  }
  return inMemoryLimit(key);
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
    const rl = await checkRateLimit(ipKey);
    const rateHeaders = {
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-RateLimit-Reset": String(rl.resetAtEpochSeconds),
      "X-RateLimit-Tier": rl.tier,
    };
    if (!rl.allowed) {
      const retryAfter = Math.max(
        1,
        rl.resetAtEpochSeconds - Math.ceil(Date.now() / 1000)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please wait a minute and try again.",
        },
        {
          status: 429,
          headers: { ...rateHeaders, "Retry-After": String(retryAfter) },
        }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json." },
        { status: 415, headers: rateHeaders }
      );
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Request body too large." },
        { status: 413, headers: rateHeaders }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body." },
        { status: 400, headers: rateHeaders }
      );
    }

    const result = QuestionnaireSchema.safeParse(parsed);
    if (!result.success) {
      console.warn(
        "[questionnaire/submit] validation failed",
        result.error.issues
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed.",
          issues: result.error.issues,
        },
        { status: 422, headers: rateHeaders }
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
