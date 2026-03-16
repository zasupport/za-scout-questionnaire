"use client";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number; // 0-indexed
}

export default function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
            background: "linear-gradient(90deg, #1B5C56, #0FEA7A)",
          }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const isComplete = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  isComplete
                    ? "bg-za-green text-navy"
                    : isActive
                    ? "bg-teal text-white shadow-lg shadow-teal/30 ring-2 ring-teal ring-offset-2"
                    : "bg-gray-200 text-mid",
                ].join(" ")}
              >
                {isComplete ? (
                  <svg
                    className="w-4 h-4"
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
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step count label */}
      <p className="text-center text-sm text-mid mt-3">
        Page {currentStep + 1} of {totalSteps}
      </p>
    </div>
  );
}
