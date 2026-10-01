import { z } from "zod";
import { PROVINCE_CODES } from "./normalize";

export const RATE_INTENTS = ["review", "rent"] as const;
export type RateIntent = (typeof RATE_INTENTS)[number];

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().min(min).max(max).nullable(),
  );

/** Address fields a client may send to start a rating. Everything is re-normalized on the server. */
export const addressDraftInputSchema = z.object({
  address_line_1: z.string().trim().min(3).max(200).regex(/^\d/, "Start with the street number."),
  city: z.string().trim().min(2).max(100),
  province: z.enum(PROVINCE_CODES),
  postal_code: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(10).nullable().optional()),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  provider_place_id: z.preprocess((v) => (v === "" ? null : v), z.string().max(300).nullable().optional()),
  intent: z.enum(RATE_INTENTS).default("review"),
  unit: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(20).nullable().optional()),
});

export type AddressDraftInput = z.infer<typeof addressDraftInputSchema>;

const PARAM_KEYS = {
  address_line_1: "line1",
  city: "city",
  province: "province",
  postal_code: "postal",
  latitude: "lat",
  longitude: "lng",
  provider_place_id: "place",
  intent: "intent",
  unit: "unit",
} as const;

export function draftToSearchParams(
  draft: Partial<Record<keyof AddressDraftInput, string | number | null | undefined>>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [field, key] of Object.entries(PARAM_KEYS)) {
    const value = draft[field as keyof AddressDraftInput];
    if (value !== null && value !== undefined && value !== "") params.set(key, String(value));
  }
  return params;
}

export function draftFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): Record<keyof AddressDraftInput, string | undefined> {
  const pick = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return Object.fromEntries(
    Object.entries(PARAM_KEYS).map(([field, key]) => [field, pick(key)]),
  ) as Record<keyof AddressDraftInput, string | undefined>;
}
