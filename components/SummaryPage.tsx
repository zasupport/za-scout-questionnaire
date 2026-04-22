"use client";

import type { ScoreResult, QuestionnaireResponse } from "@/lib/types";

interface SummaryPageProps {
  scoreResult: ScoreResult;
  response: QuestionnaireResponse;
  rawJson: object;
}

const PRIORITY_COLOURS: Record<string, string> = {
  Critical: "border-red-400 bg-red-50",
  High: "border-orange-400 bg-orange-50",
  Medium: "border-amber-400 bg-amber-50",
  Low: "border-blue-300 bg-blue-50",
};

const PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-blue-100 text-blue-700",
};

function ScoreGauge({ score, colour }: { score: number; colour: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="14"
        />
        {/* Progress */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth="14"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-in-out" }}
        />
        {/* Score text */}
        <text
          x="90"
          y="86"
          textAnchor="middle"
          fontSize="36"
          fontWeight="bold"
          fill="#0D2233"
        >
          {score}
        </text>
        <text x="90" y="108" textAnchor="middle" fontSize="13" fill="#64748B">
          Risk Score
        </text>
      </svg>
    </div>
  );
}

export default function SummaryPage({ scoreResult, response, rawJson }: SummaryPageProps) {
  const { score, level, colour, recommendations } = scoreResult;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(rawJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `ZA-Support-Scout-Assessment-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const levelBg =
    level === "Low"
      ? "bg-green-50 border-green-200 text-green-700"
      : level === "Moderate"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : level === "High"
      ? "bg-orange-50 border-orange-200 text-orange-700"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-navy mb-1">Your Assessment Results</h2>
        <p className="text-mid text-sm">
          Based on your answers, here is your personalised risk profile.
        </p>
      </div>

      {/* Score card */}
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={score} colour={colour} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm text-mid uppercase tracking-wide font-semibold mb-1">
            Risk Level
          </p>
          <span
            className={`inline-block text-xl font-bold px-4 py-1.5 rounded-full border ${levelBg}`}
          >
            {level} Risk
          </span>
          <p className="text-sm text-slate mt-3 leading-relaxed">
            {level === "Low" &&
              "Your Mac has a solid security foundation. Continue monitoring proactively to maintain this position."}
            {level === "Moderate" &&
              "There are several areas requiring attention. Address the recommendations below to reduce your exposure."}
            {level === "High" &&
              "Your Mac has significant security gaps. Immediate action is recommended to protect your data and business."}
            {level === "Critical" &&
              "Critical vulnerabilities have been identified. Your data is at serious risk. Act on the recommendations below without delay."}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-bold text-za-heading mb-4">
          Personalised Recommendations
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`rounded-xl border-l-4 p-4 ${PRIORITY_COLOURS[rec.priority] ?? "border-gray-300 bg-gray-50"}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[rec.priority] ?? ""}`}
                >
                  {rec.priority}
                </span>
                <div>
                  <p className="font-semibold text-navy text-sm">{rec.title}</p>
                  <p className="text-sm text-slate mt-1 leading-relaxed">{rec.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-xl border-2 border-teal bg-gradient-to-br from-navy to-teal p-6 text-white text-center">
        <p className="text-xs uppercase tracking-widest text-za-green font-semibold mb-1">
          Recommended Action
        </p>
        <h3 className="text-xl font-bold mb-2">Activate Health Check Scout</h3>
        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
          28-phase continuous monitoring across security, backup, performance, and compliance.
          Monthly reports. Real-time alerts. Dedicated IT advisor.
        </p>
        <div className="text-2xl font-bold text-za-green mb-1">R 4,599 / year <span className="text-sm font-normal text-gray-400">excl. VAT</span></div>
        <p className="text-xs text-gray-400 mb-4">1 doctor / 1 device — no tailored quote required in most cases</p>
        <a
          href="mailto:mary@zasupport.com?subject=Health Check Scout — Activation Request"
          className="inline-block bg-za-green text-navy font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Get Started Today
        </a>
        <p className="text-xs text-gray-400 mt-3">
          Contact us at{" "}
          <a href="mailto:mary@zasupport.com" className="underline text-gray-300">
            mary@zasupport.com
          </a>{" "}
          or call{" "}
          <a href="tel:+27645295863" className="underline text-gray-300">
            064 529 5863
          </a>
        </p>
      </div>

      {/* Download + restart */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-teal text-teal font-semibold px-4 py-3 rounded-lg hover:bg-teal-bg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download JSON Report
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 border-2 border-gray-200 text-mid font-semibold px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Start New Assessment
        </button>
      </div>

      {/* Footer note */}
      <p className="text-xs text-mid text-center leading-relaxed">
        This assessment is indicative only and does not constitute a formal audit.
        ZA Support — Practice IT. Perfected. | VAT 436-026-0014
      </p>
    </div>
  );
}
