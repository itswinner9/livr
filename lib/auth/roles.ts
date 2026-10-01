export function isStaff(role: string | null | undefined) {
  return role === "admin" || role === "moderator";
}
