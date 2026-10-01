export function track(
  event:
    | "address_search"
    | "property_view"
    | "review_start"
    | "review_submit"
    | "reply_submit"
    | "rent_report_submit"
    | "property_saved"
    | "property_compared"
    | "ai_question"
    | "manager_claim_started"
    | "manager_claim_completed"
    | "subscription_started",
  metadata?: Record<string, string | number | boolean | null>,
) {
  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", event, metadata ?? {});
  }
}
