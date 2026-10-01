"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { submitRentReport, type RentReportFormState } from "@/lib/actions/rent-reports";
import {
  FormProgress,
  FormStepNav,
  currentStepIsValid,
  firstStepWithError,
  jumpToInvalidStep,
} from "@/components/form-stepper";
import { cn } from "@/lib/utils";

type State = (NonNullable<RentReportFormState> & { attempt: number }) | null;

const TOTAL_STEPS = 3;
const STEP_HEADINGS = ["What did you pay?", "When did you live here?", "Anything else?"];
const STEP_FIELDS = [
  ["monthly_rent", "utilities_included", "bedrooms", "bathrooms", "parking_cost", "storage_cost"],
  ["lease_start_year", "lease_end_year", "renter_status"],
  ["notes"],
] as const;

function fieldClass(invalid: boolean) {
  return cn("mt-1 w-full rounded-md border px-3 py-2 font-normal", invalid ? "border-destructive" : "border-rule");
}

export function RentReportForm({
  propertyId,
  propertyHref,
  initialError,
}: {
  propertyId: string;
  propertyHref?: string;
  initialError?: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(async (prev, formData) => {
    const attempt = (prev?.attempt ?? 0) + 1;
    try {
      return { ...(await submitRentReport(formData)), attempt };
    } catch {
      return { error: "We couldn't save your rent report. Please try again.", attempt };
    }
  }, initialError ? { error: initialError, attempt: 0 } : null);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.fieldErrors) return;
    const next = firstStepWithError(STEP_FIELDS, state.fieldErrors);
    if (next) setStep(next);
  }, [state?.attempt, state?.fieldErrors]);

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-md border border-accent/20 bg-accent/10 p-5 text-sm text-ink" role="status">
        <p className="font-medium">{state.ok}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link className="font-medium underline" href={`/review/new?propertyId=${propertyId}`}>
            Also write a review
          </Link>
          {propertyHref ? (
            <Link className="underline" href={propertyHref}>
              Back to the property
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      key={state?.attempt ?? 0}
      action={action}
      className="mt-6 pb-24 sm:pb-0"
      onInvalid={(event) => jumpToInvalidStep(event, setStep)}
    >
      {state?.error ? (
        <p role="alert" className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="propertyId" value={propertyId} />
      <FormProgress step={step} total={TOTAL_STEPS} />
      <h2 className="mt-4 text-xl font-bold text-ink">{STEP_HEADINGS[step - 1]}</h2>

      <section data-step={1} hidden={step !== 1} className="mt-5 space-y-4 rounded-md border border-rule bg-surface p-5">
        <label className="block text-sm font-medium">
          Monthly rent (CAD) <span className="text-destructive">*</span>
          <input
            name="monthly_rent"
            type="number"
            required
            min={1}
            defaultValue={values.monthly_rent}
            aria-invalid={Boolean(errors.monthly_rent)}
            className={fieldClass(Boolean(errors.monthly_rent))}
          />
          {errors.monthly_rent ? <span className="mt-1 block text-sm text-destructive">{errors.monthly_rent}</span> : null}
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="utilities_included" defaultChecked={values.utilities_included === "on"} /> Utilities
          included
        </label>
        <label className="block text-sm font-medium">
          Bedrooms <span className="text-destructive">*</span>
          <input
            name="bedrooms"
            type="number"
            required
            min={0}
            max={12}
            defaultValue={values.bedrooms}
            aria-invalid={Boolean(errors.bedrooms)}
            className={fieldClass(Boolean(errors.bedrooms))}
          />
          {errors.bedrooms ? <span className="mt-1 block text-sm text-destructive">{errors.bedrooms}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          Bathrooms
          <input
            name="bathrooms"
            type="number"
            min={0}
            step={0.5}
            defaultValue={values.bathrooms}
            aria-invalid={Boolean(errors.bathrooms)}
            className={fieldClass(Boolean(errors.bathrooms))}
          />
          {errors.bathrooms ? <span className="mt-1 block text-sm text-destructive">{errors.bathrooms}</span> : null}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Parking cost
            <input
              name="parking_cost"
              type="number"
              min={0}
              defaultValue={values.parking_cost}
              aria-invalid={Boolean(errors.parking_cost)}
              className={fieldClass(Boolean(errors.parking_cost))}
            />
            {errors.parking_cost ? (
              <span className="mt-1 block text-sm text-destructive">{errors.parking_cost}</span>
            ) : null}
          </label>
          <label className="block text-sm font-medium">
            Storage cost
            <input
              name="storage_cost"
              type="number"
              min={0}
              defaultValue={values.storage_cost}
              aria-invalid={Boolean(errors.storage_cost)}
              className={fieldClass(Boolean(errors.storage_cost))}
            />
            {errors.storage_cost ? (
              <span className="mt-1 block text-sm text-destructive">{errors.storage_cost}</span>
            ) : null}
          </label>
        </div>
      </section>

      <section data-step={2} hidden={step !== 2} className="mt-5 space-y-4 rounded-md border border-rule bg-surface p-5">
        <label className="block text-sm font-medium">
          Lease start year
          <input
            name="lease_start_year"
            type="number"
            defaultValue={values.lease_start_year}
            aria-invalid={Boolean(errors.lease_start_year)}
            className={fieldClass(Boolean(errors.lease_start_year))}
          />
          {errors.lease_start_year ? (
            <span className="mt-1 block text-sm text-destructive">{errors.lease_start_year}</span>
          ) : null}
        </label>
        <label className="block text-sm font-medium">
          Lease end year
          <input
            name="lease_end_year"
            type="number"
            defaultValue={values.lease_end_year}
            aria-invalid={Boolean(errors.lease_end_year)}
            className={fieldClass(Boolean(errors.lease_end_year))}
          />
          {errors.lease_end_year ? (
            <span className="mt-1 block text-sm text-destructive">{errors.lease_end_year}</span>
          ) : null}
        </label>
        <fieldset>
          <legend className="text-sm font-medium">
            Renter status <span className="text-destructive">*</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-4">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name="renter_status"
                value="current"
                required
                defaultChecked={values.renter_status === "current"}
              />
              Current renter
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="radio"
                name="renter_status"
                value="former"
                defaultChecked={values.renter_status ? values.renter_status === "former" : true}
              />
              Former renter
            </label>
          </div>
          {errors.renter_status ? <p className="mt-1 text-sm text-destructive">{errors.renter_status}</p> : null}
        </fieldset>
      </section>

      <section data-step={3} hidden={step !== 3} className="mt-5 space-y-4 rounded-md border border-rule bg-surface p-5">
        <label className="block text-sm font-medium">
          Notes <span className="font-normal text-mute">(optional)</span>
          <textarea
            name="notes"
            rows={5}
            defaultValue={values.notes}
            aria-invalid={Boolean(errors.notes)}
            className={fieldClass(Boolean(errors.notes))}
          />
          {errors.notes ? <span className="mt-1 block text-sm text-destructive">{errors.notes}</span> : null}
        </label>
      </section>

      <FormStepNav
        step={step}
        pending={pending}
        isLast={step === TOTAL_STEPS}
        submitLabel="Submit for moderation"
        onBack={() => setStep((current) => Math.max(1, current - 1))}
        onNext={() => {
          if (formRef.current && !currentStepIsValid(formRef.current, step)) return;
          setStep((current) => Math.min(TOTAL_STEPS, current + 1));
        }}
      />
    </form>
  );
}
