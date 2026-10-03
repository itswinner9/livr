"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { HOME_NOTE_TOPICS, MOVE_CHECKLIST_STEPS } from "@/lib/daily/checklist";
import { currentYearMonth } from "@/lib/daily/dates";
import {
  addHomeNote,
  saveCitySearch,
  saveLeaseDates,
  saveRentLog,
  setHomeProperty,
  toggleChecklistStepForm,
  type DailyActionState,
} from "@/lib/actions/daily";
import { PROVINCE_CODES, PROVINCE_NAMES } from "@/lib/address/normalize";
import { PROPERTY_TYPE_LABELS, type Property } from "@/types/property";

function Message({ state }: { state: DailyActionState }) {
  if (!state?.ok && !state?.error) return null;
  return (
    <p className={`mt-3 text-sm ${state.error ? "text-destructive" : "text-mute"}`} role={state.error ? "alert" : "status"}>
      {state.error ?? state.ok}
    </p>
  );
}

export function SetHomeForm({ saved, homeId }: { saved: Property[]; homeId: string | null }) {
  const [state, action, pending] = useActionState(async (_prev: DailyActionState, formData: FormData) => setHomeProperty(formData), null);
  if (saved.length === 0) return null;
  return (
    <form action={action} className="mt-4">
      <label className="block text-sm font-medium text-ink">
        I live here
        <select
          name="propertyId"
          defaultValue={homeId ?? saved[0].id}
          className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm"
        >
          {saved.map((property) => (
            <option key={property.id} value={property.id}>
              {property.address_line_1}, {property.city}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" className="mt-3" disabled={pending}>
        {pending ? "Saving…" : "Set as my home"}
      </Button>
      <Message state={state} />
    </form>
  );
}

export function LeaseForm({
  propertyId,
  leaseEnd,
  noticeDate,
}: {
  propertyId: string | null;
  leaseEnd: string | null;
  noticeDate: string | null;
}) {
  const [state, action, pending] = useActionState(async (_prev: DailyActionState, formData: FormData) => saveLeaseDates(formData), null);
  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      <label className="block text-sm font-medium text-ink">
        Lease end
        <input
          type="date"
          name="lease_end"
          required
          defaultValue={leaseEnd ?? ""}
          className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Notice date
        <input
          type="date"
          name="notice_date"
          defaultValue={noticeDate ?? ""}
          className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm"
        />
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save dates"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function RentLogForm({
  propertyId,
  amount,
  paidOn,
}: {
  propertyId: string | null;
  amount: number | null;
  paidOn: string | null;
}) {
  const { year, month } = currentYearMonth();
  const [state, action, pending] = useActionState(async (_prev: DailyActionState, formData: FormData) => saveRentLog(formData), null);
  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <label className="block text-sm font-medium text-ink">
        Amount paid
        <input
          type="number"
          name="amount"
          min={1}
          step="1"
          required
          defaultValue={amount ?? ""}
          className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Paid on
        <input
          type="date"
          name="paid_on"
          defaultValue={paidOn ?? ""}
          className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm"
        />
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Log this month"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function HomeNoteForm({ propertyId }: { propertyId: string | null }) {
  const [state, action, pending] = useActionState(async (_prev: DailyActionState, formData: FormData) => addHomeNote(formData), null);
  return (
    <form action={action} className="mt-4 space-y-3">
      {propertyId ? <input type="hidden" name="propertyId" value={propertyId} /> : null}
      <label className="block text-sm font-medium text-ink">
        Topic
        <select name="topic" className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm">
          {HOME_NOTE_TOPICS.map((topic) => (
            <option key={topic.key} value={topic.key}>
              {topic.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-ink">
        Private note
        <textarea
          name="body"
          required
          maxLength={2000}
          rows={3}
          className="mt-1 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm"
          placeholder="What happened this week?"
        />
      </label>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save note"}
      </Button>
      <Message state={state} />
    </form>
  );
}

export function SavedSearchForm({ city, province }: { city?: string; province?: string }) {
  const [state, action, pending] = useActionState(async (_prev: DailyActionState, formData: FormData) => saveCitySearch(formData), null);
  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block text-sm font-medium text-ink">
        City
        <input
          name="city"
          required
          defaultValue={city ?? ""}
          className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm"
        />
      </label>
      <label className="block text-sm font-medium text-ink">
        Province
        <select
          name="province"
          defaultValue={province ?? ""}
          required
          className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm"
        >
          <option value="">Choose</option>
          {PROVINCE_CODES.map((code) => (
            <option key={code} value={code}>
              {PROVINCE_NAMES[code]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-ink sm:col-span-2">
        Type (optional)
        <select name="property_type" className="mt-1 h-11 w-full rounded-md border border-rule bg-paper px-3 text-sm">
          <option value="">Any type</option>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Watch this city"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function ChecklistForm({
  propertyId,
  completedSteps,
}: {
  propertyId: string;
  completedSteps: string[];
}) {
  return (
    <ul className="mt-4 space-y-2">
      {MOVE_CHECKLIST_STEPS.map((step) => {
        const done = completedSteps.includes(step.key);
        return (
          <li key={step.key}>
            <form action={toggleChecklistStepForm}>
              <input type="hidden" name="propertyId" value={propertyId} />
              <input type="hidden" name="step" value={step.key} />
              <input type="hidden" name="done" value={done ? "" : "on"} />
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-md border border-rule bg-paper px-3 text-left text-sm hover:bg-muted"
              >
                <span
                  aria-hidden
                  className={`inline-flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                    done ? "border-ink bg-ink text-paper" : "border-rule"
                  }`}
                >
                  {done ? "✓" : ""}
                </span>
                <span className={done ? "text-mute line-through" : "text-ink"}>{step.label}</span>
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
