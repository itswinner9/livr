"use client";

import type { FormEvent } from "react";

export function FormProgress({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-mute">
        Step {step} of {total}
      </p>
      <div className="h-1 overflow-hidden rounded-sm bg-star-dim" aria-hidden>
        <div className="h-full bg-star transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FormStepNav({
  step,
  pending,
  isLast,
  submitLabel,
  onBack,
  onNext,
}: {
  step: number;
  pending: boolean;
  isLast: boolean;
  submitLabel: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1 || pending}
          className="min-h-11 rounded-md px-4 text-sm font-semibold text-mute hover:text-ink disabled:opacity-40"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-paper hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Submitting…" : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-paper hover:bg-accent-hover"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export function firstStepWithError(
  stepFields: readonly (readonly string[])[],
  fieldErrors: Partial<Record<string, string>>,
) {
  for (let i = 0; i < stepFields.length; i++) {
    if (stepFields[i].some((key) => fieldErrors[key])) return i + 1;
  }
  return null;
}

export function jumpToInvalidStep(event: FormEvent, setStep: (step: number) => void) {
  const target = event.target as HTMLElement | null;
  const wrap = target?.closest("[data-step]");
  const next = Number(wrap?.getAttribute("data-step"));
  if (Number.isFinite(next) && next > 0) setStep(next);
}

export function currentStepIsValid(form: HTMLFormElement, step: number) {
  const container = form.querySelector(`[data-step="${step}"]`);
  if (!container) return true;
  const fields = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );
  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
}
