import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    // Always return the full submission to the client for download, even if backend save failed
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
    console.error("[questionnaire/submit] parse error:", err);
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }
}
