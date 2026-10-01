/**
 * Canadian address normalization used for property identity and deduplication.
 * "123 Main St", "123 MAIN STREET", "123 Main St., Surrey" and "123 Main Street Surrey BC"
 * must all resolve to the same normalized street so they map to one property.
 */

export const PROVINCE_CODES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
] as const;
export type ProvinceCode = (typeof PROVINCE_CODES)[number];

export const PROVINCE_NAMES: Record<ProvinceCode, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

const PROVINCE_ALIASES: Record<string, ProvinceCode> = {
  alberta: "AB", alta: "AB",
  "british columbia": "BC", "colombie britannique": "BC",
  manitoba: "MB", man: "MB",
  "new brunswick": "NB", "nouveau brunswick": "NB",
  newfoundland: "NL", "newfoundland and labrador": "NL", labrador: "NL", nfld: "NL", nf: "NL",
  "nova scotia": "NS", "nouvelle ecosse": "NS",
  "northwest territories": "NT", nwt: "NT",
  nunavut: "NU",
  ontario: "ON", ont: "ON",
  "prince edward island": "PE", pei: "PE",
  quebec: "QC", que: "QC", pq: "QC",
  saskatchewan: "SK", sask: "SK",
  yukon: "YT", "yukon territory": "YT", yk: "YT",
};

const STREET_SUFFIXES: Record<string, string> = {
  st: "street", str: "street", street: "street",
  ave: "avenue", av: "avenue", avenue: "avenue",
  rd: "road", road: "road",
  blvd: "boulevard", boul: "boulevard", boulevard: "boulevard",
  dr: "drive", drive: "drive",
  cres: "crescent", cr: "crescent", crescent: "crescent",
  crt: "court", ct: "court", court: "court",
  pl: "place", place: "place",
  hwy: "highway", highway: "highway",
  pkwy: "parkway", parkway: "parkway",
  ln: "lane", lane: "lane",
  terr: "terrace", ter: "terrace", terrace: "terrace",
  sq: "square", square: "square",
  cir: "circle", circ: "circle", circle: "circle",
  grv: "grove", grove: "grove",
  trl: "trail", trail: "trail",
  cl: "close", close: "close",
  wy: "way", way: "way",
  gate: "gate", mews: "mews", row: "row", walk: "walk", green: "green",
};

const DIRECTIONS: Record<string, string> = {
  n: "north", s: "south", e: "east", w: "west",
  ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
  north: "north", south: "south", east: "east", west: "west",
};

const POSTAL_CODE_RE = /\b([ABCEGHJ-NPRSTVXY])\s?(\d)\s?([ABCEGHJ-NPRSTV-Z])[\s-]?(\d)\s?([ABCEGHJ-NPRSTV-Z])\s?(\d)\b/i;

const UNIT_PREFIX_RE = /^\s*(?:(?:unit|apt|apartment|suite|ste|#)\s*[\w-]+\s*[,-]?\s*)/i;
const UNIT_DASH_RE = /^\s*#?([a-z]?\d+[a-z]?)\s*-\s*(\d+[a-z]?\s)/i;
const UNIT_SUFFIX_RE = /[,\s]+(?:unit|apt|apartment|suite|ste|#)\s*[\w-]+\s*$/i;

function basicClean(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,;:'"()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeProvince(value: string | null | undefined): ProvinceCode | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase().replace(/\./g, "");
  if ((PROVINCE_CODES as readonly string[]).includes(upper)) return upper as ProvinceCode;
  const cleaned = basicClean(value).replace(/-/g, " ");
  return PROVINCE_ALIASES[cleaned] ?? null;
}

/** Returns the compact uppercase form (e.g. "V3T1A1") or null if it isn't a valid Canadian postal code. */
export function normalizePostalCode(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = value.trim().match(POSTAL_CODE_RE);
  if (!m) return null;
  const compact = m.slice(1, 7).join("").toUpperCase();
  return compact.length === 6 ? compact : null;
}

export function formatPostalCode(value: string | null | undefined): string | null {
  const compact = normalizePostalCode(value);
  return compact ? `${compact.slice(0, 3)} ${compact.slice(3)}` : null;
}

export function normalizeCity(value: string): string {
  return basicClean(value).replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Canonical unit key, matching SQL `normalize_unit_key`.
 * "unit 1204", "#12B", "ph-2" → "1204", "12B", "PH-2". Returns null if empty or invalid.
 */
export function normalizeUnit(label: string | null | undefined): string | null {
  if (!label) return null;
  const key = label
    .trim()
    .toUpperCase()
    .replace(/^(UNIT|APARTMENT|APT|SUITE|STE)[\s.#-]*/i, "")
    .replace(/[\s#.]/g, "");
  if (!key || !/^[A-Z0-9][A-Z0-9-]{0,9}$/.test(key)) return null;
  return key;
}

/** Pulls a unit token out of a typed address such as "1204-13688 100 Ave" or "Unit 12B, 123 Main St". */
export function extractUnit(line1: string): string | null {
  const dash = line1.match(UNIT_DASH_RE);
  if (dash) return normalizeUnit(dash[1]);
  const prefix = line1.match(/^\s*(?:unit|apt|apartment|suite|ste|#)\s*([\w-]+)/i);
  if (prefix) return normalizeUnit(prefix[1]);
  const suffix = line1.match(/[,\s]+(?:unit|apt|apartment|suite|ste|#)\s*([\w-]+)\s*$/i);
  if (suffix) return normalizeUnit(suffix[1]);
  if (/^\s*[A-Za-z0-9-]{1,10}\s*$/.test(line1)) return normalizeUnit(line1);
  return null;
}

/** Removes unit/suite information so property identity stays building-level. */
export function stripUnit(line1: string): string {
  let out = line1.trim();
  const dash = out.match(UNIT_DASH_RE);
  if (dash) out = out.slice(dash[0].length - dash[2].length);
  out = out.replace(UNIT_PREFIX_RE, "");
  out = out.replace(UNIT_SUFFIX_RE, "");
  return out.trim();
}

/** "123 Main St." -> "123 main street"; "123 W Hastings St" -> "123 west hastings street". */
export function normalizeStreet(line1: string): string {
  const tokens = basicClean(stripUnit(line1)).replace(/-/g, " ").split(" ").filter(Boolean);
  return tokens
    .map((token, i) => {
      if (i === 0) return token;
      const isLast = i === tokens.length - 1;
      const next = tokens[i + 1];
      if (token === "st" && !isLast && !(next && DIRECTIONS[next])) return "saint";
      if (STREET_SUFFIXES[token] && i >= 2) return STREET_SUFFIXES[token];
      if (DIRECTIONS[token] && (i === 1 || isLast)) return DIRECTIONS[token];
      return token;
    })
    .join(" ");
}

export function buildNormalizedAddress(input: {
  address_line_1: string;
  city: string;
  province: string;
}): string {
  const province = normalizeProvince(input.province) ?? input.province.toUpperCase();
  return `${normalizeStreet(input.address_line_1)} ${normalizeCity(input.city)} ${province.toLowerCase()}`;
}

export function slugifyAddress(input: { address_line_1: string; city: string; province: string }): string {
  return buildNormalizedAddress(input)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function titleCase(value: string): string {
  return value.replace(/\b([a-z])([a-z]*)/g, (_, a: string, b: string) => a.toUpperCase() + b);
}

export interface ParsedAddress {
  address_line_1: string | null;
  city: string | null;
  province: ProvinceCode | null;
  postal_code: string | null;
}

/**
 * Best-effort parse of free-form input like "123 Main St., Surrey, BC V3T 1A1"
 * or "123 Main Street Surrey BC" into components.
 */
export function parseFreeformAddress(input: string): ParsedAddress {
  let rest = input.trim();
  const postalMatch = rest.match(POSTAL_CODE_RE);
  const postal_code = postalMatch ? normalizePostalCode(postalMatch[0]) : null;
  if (postalMatch) rest = rest.replace(postalMatch[0], " ");

  const parts = rest.split(",").map((p) => p.trim()).filter(Boolean);
  let province: ProvinceCode | null = null;

  const takeProvinceFromEnd = (text: string): string => {
    const words = text.split(/\s+/);
    for (let n = Math.min(4, words.length); n >= 1; n--) {
      const candidate = words.slice(words.length - n).join(" ");
      const code = normalizeProvince(candidate);
      if (code && words.length - n >= 0) {
        province = code;
        return words.slice(0, words.length - n).join(" ");
      }
    }
    return text;
  };

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const stripped = takeProvinceFromEnd(last);
    if (province) {
      if (stripped) parts[parts.length - 1] = stripped;
      else parts.pop();
    }
    const line1 = parts[0] ?? null;
    const city = parts.length >= 2 ? parts[1] : null;
    return {
      address_line_1: line1,
      city: city ? titleCase(normalizeCity(city)) : null,
      province,
      postal_code,
    };
  }

  // No commas: split after the street suffix.
  let text = takeProvinceFromEnd(parts[0] ?? "");
  text = text.trim();
  const words = text.split(/\s+/).filter(Boolean);
  let suffixIndex = -1;
  for (let i = 2; i < words.length; i++) {
    const w = basicClean(words[i]);
    if (STREET_SUFFIXES[w]) suffixIndex = i;
  }
  if (suffixIndex > 0) {
    let end = suffixIndex;
    const after = words[suffixIndex + 1] ? basicClean(words[suffixIndex + 1]) : "";
    if (DIRECTIONS[after] && after.length <= 2) end += 1;
    const line1 = words.slice(0, end + 1).join(" ");
    const city = words.slice(end + 1).join(" ");
    return {
      address_line_1: line1 || null,
      city: city ? titleCase(normalizeCity(city)) : null,
      province,
      postal_code,
    };
  }
  return { address_line_1: text || null, city: null, province, postal_code };
}

/** Normalizes a search query to match `properties.normalized_address` tokens. */
export function normalizeSearchQuery(query: string): string {
  const postal = normalizePostalCode(query);
  if (postal && query.replace(/\s/g, "").length <= 7) return postal.toLowerCase();

  const parsed = parseFreeformAddress(query);
  if (parsed.address_line_1 && /^\s*#?\d/.test(parsed.address_line_1)) {
    const pieces = [normalizeStreet(parsed.address_line_1)];
    if (parsed.city) pieces.push(normalizeCity(parsed.city));
    if (parsed.province) pieces.push(parsed.province.toLowerCase());
    if (parsed.postal_code) pieces.push(parsed.postal_code.toLowerCase());
    return pieces.join(" ").trim();
  }
  const words = basicClean(query).replace(/-/g, " ").split(" ").filter(Boolean);
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    const code = normalizeProvince(words.slice(words.length - n).join(" "));
    if (code) {
      words.splice(words.length - n, n, code.toLowerCase());
      break;
    }
  }
  return words.join(" ").slice(0, 200);
}

export interface PropertyIdentity {
  address_line_1: string;
  city: string;
  province: string;
  postal_code?: string | null;
  provider_place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function civicNumber(line1: string): string | null {
  return normalizeStreet(line1).match(/^(\d+[a-z]?)\b/)?.[1] ?? null;
}

/**
 * Decides whether two address records describe the same property.
 * Does not rely only on exact text: provider IDs, normalized street + city/postal code,
 * and coordinates with a matching civic number are all considered.
 */
export function isSameProperty(a: PropertyIdentity, b: PropertyIdentity): boolean {
  if (a.provider_place_id && b.provider_place_id && a.provider_place_id === b.provider_place_id) {
    return true;
  }
  const streetA = normalizeStreet(a.address_line_1);
  const streetB = normalizeStreet(b.address_line_1);
  const provA = normalizeProvince(a.province);
  const provB = normalizeProvince(b.province);
  if (provA && provB && provA !== provB) return false;

  if (streetA === streetB) {
    if (normalizeCity(a.city) === normalizeCity(b.city)) return true;
    const postalA = normalizePostalCode(a.postal_code);
    const postalB = normalizePostalCode(b.postal_code);
    if (postalA && postalB && postalA === postalB) return true;
  }

  if (
    a.latitude != null && a.longitude != null && b.latitude != null && b.longitude != null &&
    civicNumber(a.address_line_1) && civicNumber(a.address_line_1) === civicNumber(b.address_line_1)
  ) {
    return haversineMeters({ lat: a.latitude, lng: a.longitude }, { lat: b.latitude, lng: b.longitude }) < 40;
  }
  return false;
}

export const slugifyProperty = slugifyAddress;

export function parseSearchQuery(query: string) {
  const postal = normalizePostalCode(query);
  return {
    original: query.trim(),
    normalized: normalizeSearchQuery(query),
    postal,
  };
}
