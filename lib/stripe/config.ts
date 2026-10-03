export const PRICING = [
  {
    id: "free-renter",
    name: "Free renter",
    audience: "Renters",
    priceLabel: "Free",
    features: [
      "Search and public reviews",
      "Basic property data",
      "Basic reported rent history",
      "Limited Ask LivRank",
    ],
  },
  {
    id: "premium-renter",
    name: "Premium renter",
    audience: "Renters",
    priceLabel: process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL || "Configurable",
    features: [
      "Advanced comparisons (planned)",
      "Higher Ask LivRank limits",
      "Saved searches and watch alerts",
    ],
  },
  {
    id: "manager-free",
    name: "Manager",
    audience: "Property managers",
    priceLabel: "Free claim",
    features: ["Claim a property", "Respond to reviews after verification"],
  },
  {
    id: "manager-pro",
    name: "Manager Pro",
    audience: "Property managers",
    priceLabel: process.env.NEXT_PUBLIC_MANAGER_PRO_PRICE_LABEL || "Configurable",
    features: ["Analytics and alerts (planned)", "Does not alter ratings"],
  },
];
