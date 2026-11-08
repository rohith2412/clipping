export const PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    priceId: process.env.STRIPE_PRICE_STARTER ?? "",
    clipsPerMonth: 100,
    features: [
      "100 clips per month",
      "AI peak moment detection",
      "AI voiceover generation",
      "Burned-in captions",
      "YouTube, TikTok, Instagram posting",
      "Post scheduling",
      "Clip editor",
      "Download clips",
    ],
  },
  pro: {
    name: "Pro",
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO ?? "",
    clipsPerMonth: Infinity,
    features: [
      "Unlimited clips",
      "Everything in Starter",
      "Team collaboration (up to 5 members)",
      "Priority processing",
      "Advanced analytics",
      "Bulk scheduling",
      "Custom branding on captions",
      "API access",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
