import { REVIEW_TOPICS, type ReviewTopic } from "@/types/review";

/** Word-boundary keywords for each topic. Mention counts stay grounded in the review text. */
const TOPIC_KEYWORDS: Record<ReviewTopic, RegExp> = {
  maintenance: /\b(maintenance|repair|repairs|work[\s-]?order|handyman|broken|fix(?:ed|ing)?)\b/i,
  management: /\b(management|manager|managers|landlord|superintendent|property[\s-]?manager)\b/i,
  noise: /\b(noise|noisy|loud|quiet|thin[\s-]?walls|soundproof)\b/i,
  parking: /\b(parking|parkade|garage|stall)\b/i,
  security: /\b(security|secure|unsafe|break[\s-]?in|fob|camera|cameras)\b/i,
  elevator: /\b(elevator|elevators|lift)\b/i,
  heating: /\b(heat(?:ing)?|furnace|radiator|no heat)\b/i,
  water: /\b(water[\s-]?pressure|hot[\s-]?water|no[\s-]?water|rusty[\s-]?water)\b/i,
  plumbing: /\b(plumb(?:ing|er)|leak|leaking|drain|pipe|pipes)\b/i,
  cleanliness: /\b(clean(?:liness)?|dirty|garbage|trash|hallways)\b/i,
  pests: /\b(pest|pests|mice|mouse|cockroach|roach(?:es)?|bed[\s-]?bugs?|ants)\b/i,
  neighbours: /\b(neighbour|neighbor|neighbours|neighbors)\b/i,
  rent_increases: /\b(rent[\s-]?increase|increased[\s-]+the[\s-]+rent|rais(?:e|ed|ing)[\s-]+(?:the[\s-]+)?rent)\b/i,
  building_condition: /\b(building[\s-]?condition|run[\s-]?down|old[\s-]?building|falling[\s-]?apart)\b/i,
  amenities: /\b(amenit(?:y|ies)|gym|pool|concierge)\b/i,
  transit: /\b(transit|bus|skytrain|subway|go[\s-]?train|commute)\b/i,
  location: /\b(location|downtown|walkable|close[\s-]?to)\b/i,
};

/** Returns topics actually mentioned in the review. Does not invent counts. */
export function topicsFromReviewText(text: string): ReviewTopic[] {
  const haystack = text.normalize("NFKC");
  return REVIEW_TOPICS.filter((topic) => TOPIC_KEYWORDS[topic].test(haystack));
}
