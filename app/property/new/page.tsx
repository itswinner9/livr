import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createPropertyForm } from "@/lib/actions/forms";
import { PROVINCES, PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/types/property";

export const metadata: Metadata = { title: "Add an address", robots: { index: false, follow: false } };

type Params = Partial<Record<"error" | "line1" | "line2" | "city" | "province" | "postal" | "building" | "type", string>>;

export default async function NewPropertyPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/property/new");
  const p = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="border-b border-rule pb-4 text-3xl font-semibold text-ink">Add an address manually</h1>
      <p className="mt-2 text-sm text-mute">
        Faster option:{" "}
        <Link className="text-accent underline" href="/rate">
          search and pick the address
        </Link>
        . Use this form only if the address doesn&apos;t appear in suggestions. Enter the building address, never
        your unit number.
      </p>
      {p.error ? (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {p.error.slice(0, 200)}
        </p>
      ) : null}
      <form action={createPropertyForm} className="mt-6 space-y-4">
        <Field name="address_line_1" label="Street address (with building number)" defaultValue={p.line1} required />
        <Field name="address_line_2" label="Address line 2 (optional)" defaultValue={p.line2} />
        <Field name="city" label="City" defaultValue={p.city} required />
        <label className="block text-sm font-medium">
          Province
          <select
            name="province"
            required
            defaultValue={p.province ?? "BC"}
            className="mt-1 w-full rounded-md border border-rule px-3 py-2"
          >
            {PROVINCES.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </label>
        <Field name="postal_code" label="Postal code (optional)" defaultValue={p.postal} />
        <Field name="building_name" label="Building name (optional)" defaultValue={p.building} />
        <label className="block text-sm font-medium">
          Property type (optional)
          <select
            name="property_type"
            defaultValue={p.type ?? ""}
            className="mt-1 w-full rounded-md border border-rule px-3 py-2"
          >
            <option value="">Unknown</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 rounded-md bg-accent px-4 font-medium text-paper hover:bg-accent-hover" type="submit">
          Continue to rating
        </button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-sm border border-rule bg-surface px-3 py-2.5 text-sm font-normal"
      />
    </label>
  );
}
