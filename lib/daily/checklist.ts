export const MOVE_CHECKLIST_STEPS = [
  { key: "view", label: "View the building file" },
  { key: "reviews", label: "Read the reviews" },
  { key: "rent", label: "Compare reported rent" },
  { key: "insurance", label: "Get tenant insurance" },
  { key: "utilities", label: "Set up utilities" },
  { key: "keys", label: "Confirm keys and move-in" },
] as const;

export type MoveChecklistStep = (typeof MOVE_CHECKLIST_STEPS)[number]["key"];

export const HOME_NOTE_TOPICS = [
  { key: "noise", label: "Noise" },
  { key: "repairs", label: "Repairs" },
  { key: "heat", label: "Heat" },
  { key: "pests", label: "Pests" },
  { key: "management", label: "Management" },
  { key: "other", label: "Other" },
] as const;

export type HomeNoteTopic = (typeof HOME_NOTE_TOPICS)[number]["key"];

export function isMoveChecklistStep(value: string): value is MoveChecklistStep {
  return MOVE_CHECKLIST_STEPS.some((step) => step.key === value);
}
