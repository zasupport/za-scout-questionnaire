"use client";

import { useState } from "react";
import type { Answers, QuestionnaireResponse } from "@/lib/types";
import { PAGES } from "@/lib/questions";
import { calculateScore } from "@/lib/scoring";
import StepIndicator from "./StepIndicator";
import ChoiceButton from "./ChoiceButton";
import SummaryPage from "./SummaryPage";

type SubmitState = "idle" | "submitting" | "done" | "error";

export default function Questionnaire() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedResponse, setSavedResponse] = useState<QuestionnaireResponse | null>(null);

  const totalSteps = PAGES.length;
  const page = PAGES[currentStep];
  const scoreResult = calculateScore(answers);

  // ── Answer helpers ──────────────────────────────────────────────────────────

  function setSingle(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMulti(questionId: string, value: string) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[] | undefined) ?? [];
      // If "none" is selected, clear all others
      if (value === "none") {
        return { ...prev, [questionId]: current.includes("none") ? [] : ["none"] };
      }
      // Deselect "none" if selecting a real option
      const withoutNone = current.filter((v) => v !== "none");
      const exists = withoutNone.includes(value);
      return {
        ...prev,
        [questionId]: exists
          ? withoutNone.filter((v) => v !== value)
          : [...withoutNone, value],
      };
    });
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function isPageValid(): boolean {
    for (const q of page.questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (!val || (Array.isArray(val) && val.length === 0)) return false;
      if (typeof val === "string" && val.trim() === "") return false;
    }
    return true;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function handleNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitState("submitting");
    setSubmitError(null);

    const payload: QuestionnaireResponse = {
      name: (answers.name as string) ?? "",
      email: (answers.email as string) ?? "",
      machine_type: (answers.machine_type as string) ?? "",
      mac_year: (answers.mac_year as string) ?? "",
      macos_version: (answers.macos_version as string) ?? "",
      filevault_enabled: (answers.filevault_enabled as string) ?? "",
      backup_status: (answers.backup_status as string) ?? "",
      last_backup: (answers.last_backup as string) ?? "",
      security_software: (answers.security_software as string) ?? "",
      data_types: (answers.data_types as string[]) ?? [],
      public_wifi: (answers.public_wifi as string) ?? "",
      sharing: (answers.sharing as string) ?? "",
      priority_areas: (answers.priority_areas as string[]) ?? [],
      it_management: (answers.it_management as string) ?? "",
      past_issues: (answers.past_issues as string[]) ?? [],
      security_warnings: (answers.security_warnings as string) ?? "",
      repair_history: (answers.repair_history as string) ?? "",
      business_use: (answers.business_use as string) ?? "",
      client_data: (answers.client_data as string) ?? "",
      popia_awareness: (answers.popia_awareness as string) ?? "",
      audit_required: (answers.audit_required as string) ?? "",
      risk_score: scoreResult.score,
      risk_level: scoreResult.level,
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setSavedResponse(data.response ?? payload);
      setSubmitState("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed. Please try again.";
      setSubmitError(msg);
      setSubmitState("error");
    }
  }

  // ── Summary view ────────────────────────────────────────────────────────────

  if (submitState === "done" && savedResponse) {
    return (
      <SummaryPage
        scoreResult={scoreResult}
        response={savedResponse}
        rawJson={savedResponse}
      />
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  return (
    <div>
      <StepIndicator totalSteps={totalSteps} currentStep={currentStep} />

      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-za-heading">{page.title}</h2>
        <p className="text-sm text-mid mt-1">{page.subtitle}</p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {page.questions.map((question) => (
          <div key={question.id} className="card">
            <p className="text-sm font-semibold text-navy mb-3 leading-snug">
              {question.label}
              {question.required && (
                <span className="text-red-500 ml-1" aria-label="required">
                  *
                </span>
              )}
            </p>

            {/* Text / Email */}
            {(question.type === "text" || question.type === "email") && (
              <input
                type={question.type}
                value={(answers[question.id] as string) ?? ""}
                onChange={(e) => setSingle(question.id, e.target.value)}
                placeholder={question.placeholder}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-slate focus:outline-none focus:border-teal transition-colors"
              />
            )}

            {/* Single select */}
            {question.type === "single" && question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    label={opt.label}
                    selected={answers[question.id] === opt.value}
                    onClick={() => setSingle(question.id, opt.value)}
                  />
                ))}
              </div>
            )}

            {/* Multi select */}
            {question.type === "multi" && question.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt) => {
                  const selected =
                    Array.isArray(answers[question.id]) &&
                    (answers[question.id] as string[]).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleMulti(question.id, opt.value)}
                      className={[
                        "w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150 flex items-center gap-3 group",
                        selected
                          ? "border-teal bg-teal-bg text-teal font-semibold"
                          : "border-gray-200 bg-white text-slate hover:border-teal/50 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          selected
                            ? "border-teal bg-teal"
                            : "border-gray-300 bg-white group-hover:border-teal/50",
                        ].join(" ")}
                      >
                        {selected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm leading-snug">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {submitState === "error" && submitError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="text-xs text-mid">
          {currentStep + 1} / {totalSteps}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!isPageValid() || submitState === "submitting"}
          className="btn-primary"
        >
          {submitState === "submitting"
            ? "Submitting..."
            : currentStep === totalSteps - 1
            ? "Get My Report"
            : "Next"}
        </button>
      </div>
    </div>
  );
}
