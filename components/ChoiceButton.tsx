"use client";

interface ChoiceButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function ChoiceButton({ label, selected, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
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
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          selected ? "border-teal bg-teal" : "border-gray-300 bg-white group-hover:border-teal/50",
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-sm leading-snug">{label}</span>
    </button>
  );
}
