"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitReview, type ReviewFormState } from "@/lib/actions/reviews";
import { StarRatingInput } from "@/components/star-rating-input";
import {
  FormProgress,
  FormStepNav,
  currentStepIsValid,
  firstStepWithError,
  jumpToInvalidStep,
} from "@/components/form-stepper";
import { cn } from "@/lib/utils";

const REQUIRED_CATEGORIES = [
  ["maintenance_rating", "Maintenance", "How quickly and well were repairs handled?"],
  ["management_rating", "Management", "Communication and professionalism."],
  ["noise_rating", "Noise", "Higher means quieter."],
  ["cleanliness_rating", "Cleanliness", "Common areas and move-in condition."],
  ["building_condition_rating", "Building condition", "Heating, plumbing, elevators, pests."],
  ["value_rating", "Value", "What you got for the rent you paid."],
] as const;

const OPTIONAL_CATEGORIES = [
  ["parking_rating", "Parking", "Availability and cost. Skip if the building has no parking."],
] as const;

const MIN_BODY = 50;
const MAX_BODY = 10_000;
const TOTAL_STEPS = 4;
const STEP_HEADINGS = [
  "How was living here?",
  "Rate the building",
  "Tell the next renter",
  "About your tenancy",
];
const STEP_FIELDS = [
  ["overall_rating", "renter_status", "unit_label"],
  [
    "maintenance_rating",
    "management_rating",
    "noise_rating",
    "cleanliness_rating",
    "building_condition_rating",
    "value_rating",
    "parking_rating",
  ],
  ["review_title", "review_body"],
  ["bedrooms", "bathrooms", "monthly_rent", "move_in_year", "move_out_year"],
] as const;

type State = (NonNullable<ReviewFormState> & { attempt: number }) | null;

export function ReviewForm({
  propertyId,
  propertyHref,
  unitLabel = "",
}: {
  propertyId: string;
  propertyHref?: string;
  unitLabel?: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(async (prev, formData) => {
    const attempt = (prev?.attempt ?? 0) + 1;
    try {
      return { ...(await submitReview(formData)), attempt };
    } catch {
      return { error: "We couldn't save your review. Please try again.", attempt };
    }
  }, null);
  const values = state?.values ?? {};
  const errors = state?.fieldErrors ?? {};
  const [bodyLength, setBodyLength] = useState(0);
  const [step, setStep] = useState(1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.fieldErrors) return;
    const next = firstStepWithError(STEP_FIELDS, state.fieldErrors);
    if (next) setStep(next);
  }, [state?.attempt, state?.fieldErrors]);

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-md border border-accent/20 bg-accent/10 p-5 text-ink" role="status">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 aria-hidden className="size-5" /> {state.ok}
        </p>
        <p className="mt-2 text-sm">
          {state.published
            ? "It's now visible on the property page."
            : "Moderators usually review new submissions within a day or two. You'll get a notification when it's published."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link className="font-medium underline" href={`/rent-report/new?propertyId=${propertyId}`}>
            Also report your rent
          </Link>
          {propertyHref ? (
            <Link className="underline" href={propertyHref}>
              Back to the property
            </Link>
          ) : null}
          <Link className="underline" href="/account/reviews">
            My reviews
          </Link>
        </div>
      </div>
    );
  }

  const bodyCount = bodyLength || (values.review_body?.length ?? 0);

  return (
    <form
      ref={formRef}
      key={state?.attempt ?? 0}
      action={action}
      className="mt-6 pb-24 sm:pb-0"
      noValidate={false}
      onInvalid={(event) => jumpToInvalidStep(event, setStep)}
    >
      {state?.error ? (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="propertyId" value={propertyId} />
      <FormProgress step={step} total={TOTAL_STEPS} />
      <h2 className="mt-4 text-xl font-bold text-ink">{STEP_HEADINGS[step - 1]}</h2>

      <section data-step={1} hidden={step !== 1} className="mt-5 space-y-5 rounded-md border border-rule bg-surface p-5">
        <StarRatingInput
          name="overall_rating"
          label="Overall, how was living here?"
          required
          size="lg"
          defaultValue={values.overall_rating ? Number(values.overall_rating) : null}
          error={errors.overall_rating}
        />
        <fieldset>
          <legend className="text-sm font-medium">
            Do you live here now? <span className="text-destructive">*</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="renter_status"
                value="current"
                required
                defaultChecked={values.renter_status === "current"}
              />
              Current renter
            </label>
            <label className="flex min-h-11 items-center gap-2">
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
        <label className="block text-sm font-medium">
          Unit number <span className="font-normal text-mute">(optional)</span>
          <input
            name="unit_label"
            maxLength={20}
            defaultValue={values.unit_label ?? unitLabel}
            placeholder="e.g. 1204 or 12B"
            aria-invalid={Boolean(errors.unit_label)}
            className={cn(
              "mt-1 w-full rounded-md border px-3 py-2 font-normal",
              errors.unit_label ? "border-destructive" : "border-rule",
            )}
          />
          {errors.unit_label ? <span className="mt-1 block text-sm text-destructive">{errors.unit_label}</span> : null}
        </label>
        <p className="text-xs text-mute">
          Shown publicly only if you&apos;re a former renter. Current renters&apos; reviews count toward the building
          only.
        </p>
      </section>

      <section data-step={2} hidden={step !== 2} className="mt-5 space-y-4 rounded-md border border-rule bg-surface p-5">
        <p className="text-sm text-mute">Required except parking. Tap the stars for each area.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {REQUIRED_CATEGORIES.map(([key, label, description]) => (
            <StarRatingInput
              key={key}
              name={key}
              label={label}
              description={description}
              required
              defaultValue={values[key] ? Number(values[key]) : null}
              error={errors[key]}
            />
          ))}
          {OPTIONAL_CATEGORIES.map(([key, label, description]) => (
            <StarRatingInput
              key={key}
              name={key}
              label={label}
              description={description}
              defaultValue={values[key] ? Number(values[key]) : null}
              error={errors[key]}
            />
          ))}
        </div>
      </section>

      <section data-step={3} hidden={step !== 3} className="mt-5 space-y-4 rounded-md border border-rule bg-surface p-5">
        <label className="block text-sm font-medium">
          Give your review a title <span className="text-destructive">*</span>
          <input
            name="review_title"
            required
            minLength={3}
            maxLength={150}
            defaultValue={values.review_title}
            placeholder="e.g. Quiet building, slow repairs"
            aria-invalid={Boolean(errors.review_title)}
            className={cn(
              "mt-1 w-full rounded-md border px-3 py-2 font-normal",
              errors.review_title ? "border-destructive" : "border-rule",
            )}
          />
          {errors.review_title ? <span className="mt-1 block text-sm text-destructive">{errors.review_title}</span> : null}
        </label>
        <label className="block text-sm font-medium">
          What was it like to live here? <span className="text-destructive">*</span>
          <textarea
            name="review_body"
            required
            minLength={MIN_BODY}
            maxLength={MAX_BODY}
            rows={8}
            defaultValue={values.review_body}
            onChange={(e) => setBodyLength(e.target.value.length)}
            placeholder="Describe specific things you experienced: repairs, noise, management, pests, heating, parking…"
            aria-invalid={Boolean(errors.review_body)}
            aria-describedby="review-body-count"
            className={cn(
              "mt-1 w-full rounded-md border px-3 py-2 font-normal",
              errors.review_body ? "border-destructive" : "border-rule",
            )}
          />
          <span
            id="review-body-count"
            className={cn("mt-1 block text-xs font-normal", bodyCount >= MIN_BODY ? "text-ink" : "text-mute")}
          >
            {bodyCount < MIN_BODY
              ? `${MIN_BODY - bodyCount} more characters needed`
              : `${bodyCount.toLocaleString()} / ${MAX_BODY.toLocaleString()} characters`}
          </span>
          {errors.review_body ? <span className="mt-1 block text-sm text-destructive">{errors.review_body}</span> : null}
        </label>
      </section>

      <section data-step={4} hidden={step !== 4} className="mt-5 space-y-4 rounded-md border border-rule bg-surface p-5">
        <p className="text-sm text-mute">Optional. Skip anything you don&apos;t remember.</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["bedrooms", "Bedrooms", { min: 0, max: 10 }],
              ["bathrooms", "Bathrooms", { min: 0, max: 10, step: 0.5 }],
              ["monthly_rent", "Monthly rent (CAD)", { min: 1 }],
              ["move_in_year", "Move-in year", { min: 1950, max: new Date().getFullYear() + 1 }],
              ["move_out_year", "Move-out year", { min: 1950, max: new Date().getFullYear() + 1 }],
            ] as const
          ).map(([key, label, attrs]) => (
            <label key={key} className="text-sm font-medium">
              {label}
              <input
                name={key}
                type="number"
                inputMode="decimal"
                defaultValue={values[key]}
                aria-invalid={Boolean(errors[key])}
                className={cn(
                  "mt-1 w-full rounded-md border px-3 py-2 font-normal",
                  errors[key] ? "border-destructive" : "border-rule",
                )}
                {...attrs}
              />
              {errors[key] ? <span className="mt-1 block text-xs text-destructive">{errors[key]}</span> : null}
            </label>
          ))}
        </div>
        <p className="text-xs text-mute">
          Don&apos;t put your unit number in the review text. Use the unit field on step 1 if you want to attach it.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="public_display_name" defaultChecked={values.public_display_name === "on"} />
          Show my public display name (otherwise your review is anonymous)
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
      <p className="mt-3 text-xs text-mute">Reviews are checked by moderators before they appear publicly.</p>
    </form>
  );
}
