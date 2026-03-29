export const STRIPE_PRICES = {
  premium_monthly: process.env.STRIPE_PREMIUM_PRICE_ID!,
  premium_annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!,
  credits_10: process.env.STRIPE_CREDITS_10_PRICE_ID!,
  credits_35: process.env.STRIPE_CREDITS_35_PRICE_ID!,
  credits_60: process.env.STRIPE_CREDITS_60_PRICE_ID!,
} as const;

export const CREDIT_PACKS: readonly { priceEnv: keyof typeof STRIPE_PRICES; credits: number; price: string; label: string; popular?: boolean }[] = [
  { priceEnv: "credits_10", credits: 10, price: "$1", label: "10 Credits" },
  { priceEnv: "credits_35", credits: 35, price: "$3", label: "35 Credits", popular: true },
  { priceEnv: "credits_60", credits: 60, price: "$5", label: "60 Credits" },
];

/** Map Stripe price IDs → credit amounts for webhook processing */
export function getCreditsForPrice(priceId: string): number | null {
  if (priceId === STRIPE_PRICES.credits_10) return 10;
  if (priceId === STRIPE_PRICES.credits_35) return 35;
  if (priceId === STRIPE_PRICES.credits_60) return 60;
  return null;
}
