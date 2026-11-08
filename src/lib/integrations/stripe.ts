import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-10-28.endive",
  typescript: true,
});

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string
) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?checkout=canceled`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });
}

export async function createPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });
}

export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({ email, name });
}

export function getPlanFromPriceId(priceId: string): "starter" | "pro" {
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "starter";
}
