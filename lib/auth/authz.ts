import type { ContentStatus, Role, SubscriptionStatus } from "@/types/database";

/** Pure authorization rules. The database enforces the same rules through RLS and triggers. */

export function isModeratorRole(role: string | null | undefined): boolean {
  return role === "moderator" || role === "admin";
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

export function isManagerRole(role: string | null | undefined): boolean {
  return role === "manager" || role === "admin";
}

export function hasPremiumAccess(status: SubscriptionStatus | null | undefined): boolean {
  return status === "premium" || status === "manager_pro" || status === "manager_portfolio";
}

export const ASK_DAILY_LIMIT = { free: 5, premium: 50 } as const;

export function askDailyLimit(status: SubscriptionStatus | null | undefined): number {
  return hasPremiumAccess(status) ? ASK_DAILY_LIMIT.premium : ASK_DAILY_LIMIT.free;
}

/** A renter may edit only their own review, and never while it is hidden or rejected by moderation. */
export function canEditReview(
  actorId: string | null | undefined,
  review: { user_id: string | null; status: ContentStatus },
): boolean {
  if (!actorId || review.user_id !== actorId) return false;
  return review.status === "pending" || review.status === "published";
}

/** Managers may respond only on properties they hold an approved claim for. */
export function canManageProperty(
  actor: { id: string; role: Role } | null | undefined,
  propertyId: string,
  approvedClaimPropertyIds: readonly string[],
): boolean {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  return approvedClaimPropertyIds.includes(propertyId);
}

/** Fields a user may change on their own profile. Role and subscription are server-controlled. */
export const USER_EDITABLE_PROFILE_FIELDS = ["display_name", "avatar_url"] as const;

export function sanitizeProfileUpdate(input: Record<string, unknown>) {
  const out: Partial<Record<(typeof USER_EDITABLE_PROFILE_FIELDS)[number], unknown>> = {};
  for (const field of USER_EDITABLE_PROFILE_FIELDS) {
    if (field in input) out[field] = input[field];
  }
  return out;
}

/** Only these roles can be assigned from the admin UI. */
export function canAssignRole(actorRole: Role | null | undefined, target: Role): boolean {
  if (!isAdminRole(actorRole)) return false;
  return ["user", "moderator", "admin", "manager"].includes(target);
}
