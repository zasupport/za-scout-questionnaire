"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Answers, QuestionnaireResponse } from "@/lib/types";
import { PAGES } from "@/lib/questions";
import { calculateScore } from "@/lib/scoring";
import StepIndicator from "./StepIndicator";
import ChoiceButton from "./ChoiceButton";
import SummaryPage from "./SummaryPage";

type SubmitState = "idle" | "submitting" | "done" | "error";

const AUTOSAVE_KEY = "za-scout-questionnaire-draft-v1";

export default function Questionnaire() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedResponse, setSavedResponse] = useState<QuestionnaireResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { step?: number; answers?: Answers };
        if (parsed.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers);
        }
        if (
          typeof parsed.step === "number" &&
          parsed.step >= 0 &&
          parsed.step < PAGES.length
        ) {
          setCurrentStep(parsed.step);
        }
      }
    } catch {
      // corrupt draft — ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (submitState === "done") return;
    try {
      window.sessionStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({ step: currentStep, answers })
      );
    } catch {
      // storage full or disabled — ignore
    }
  }, [answers, currentStep, hydrated, submitState]);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [currentStep]);

  const totalSteps = PAGES.length;
  const page = PAGES[currentStep];
  const scoreResult = useMemo(() => calculateScore(answers), [answers]);

  function setSingle(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMulti(questionId: string, value: string) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[] | undefined) ?? [];
      if (value === "none") {
        return { ...prev, [questionId]: current.includes("none") ? [] : ["none"] };
      }
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

  function isPageValid(): boolean {
    for (const q of page.questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (q.type === "consent") {
        if (val !== "true") return false;
        continue;
      }
      if (!val || (Array.isArray(val) && val.length === 0)) return false;
      if (typeof val === "string" && val.trim() === "") return false;
    }
    return true;
  }

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

  async function handleSubmit() {
    setSubmitState("submitting");
    setSubmitError(null);

    const str = (k: keyof Answers) => (answers[k] as string) ?? "";
    const arr = (k: keyof Answers) => (answers[k] as string[]) ?? [];
    const payload: QuestionnaireResponse = {
      name: str("name"),
      email: str("email"),
      machine_type: str("machine_type"),
      mac_year: str("mac_year"),
      macos_version: str("macos_version"),
      filevault_enabled: str("filevault_enabled"),
      backup_status: str("backup_status"),
      last_backup: str("last_backup"),
      security_software: str("security_software"),
      data_types: arr("data_types"),
      public_wifi: str("public_wifi"),
      sharing: str("sharing"),
      priority_areas: arr("priority_areas"),
      it_management: str("it_management"),
      past_issues: arr("past_issues"),
      security_warnings: str("security_warnings"),
      repair_history: str("repair_history"),
      business_use: str("business_use"),
      client_data: str("client_data"),
      popia_awareness: str("popia_awareness"),
      audit_required: str("audit_required"),
      popia_consent: answers.popia_consent === "true",
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
      try {
        window.sessionStorage.removeItem(AUTOSAVE_KEY);
      } catch {
        // ignore
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Submission failed. Please try again.";
      setSubmitError(msg);
      setSubmitState("error");
    }
  }

  if (submitState === "done" && savedResponse) {
    return (
      <SummaryPage
        scoreResult={scoreResult}
        response={savedResponse}
        rawJson={savedResponse}
      />
    );
  }

  return (
    <div>
      <StepIndicator totalSteps={totalSteps} currentStep={currentStep} />

      <div className="mb-6">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold text-za-heading focus:outline-none"
        >
          {page.title}
        </h2>
        <p className="text-sm text-mid mt-1">{page.subtitle}</p>
      </div>

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

            {(question.type === "text" || question.type === "email") && (
              <input
                type={question.type}
                value={(answers[question.id] as string) ?? ""}
                onChange={(e) => setSingle(question.id, e.target.value)}
                placeholder={question.placeholder}
                autoComplete={question.type === "email" ? "email" : "name"}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm text-slate focus:outline-none focus:border-teal transition-colors"
              />
            )}

            {question.type === "single" && question.options && (
              <div role="radiogroup" aria-label={question.label} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

            {question.type === "consent" && (
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={answers[question.id] === "true"}
                  onChange={(e) =>
                    setSingle(question.id, e.target.checked ? "true" : "")
                  }
                  aria-required={question.required}
                  className="mt-1 w-5 h-5 flex-shrink-0 cursor-pointer accent-teal"
                />
                <span className="text-xs text-slate leading-relaxed">
                  {question.consentText}
                </span>
              </label>
            )}

            {question.type === "multi" && question.options && (
              <div role="group" aria-label={question.label} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt) => {
                  const selected =
                    Array.isArray(answers[question.id]) &&
                    (answers[question.id] as string[]).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggleMulti(question.id, opt.value)}
                      className={[
                        "w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150 flex items-center gap-3 group",
                        selected
                          ? "border-teal bg-teal-bg text-teal font-semibold"
                          : "border-gray-200 bg-white text-slate hover:border-teal/50 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
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

      {submitState === "error" && submitError && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0 || submitState === "submitting"}
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
          disabled={
            !isPageValid() ||
            submitState === "submitting" ||
            submitState === "done"
          }
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
