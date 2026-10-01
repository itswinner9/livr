/** Only same-origin relative paths are allowed as post-login destinations. */
export function safeNextPath(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(path) || path.length > 1000) return fallback;
  return path;
}
