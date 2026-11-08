import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import {
  stripe,
  createCheckoutSession,
  createCustomer,
} from "@/lib/integrations/stripe";
import { PLANS } from "@/lib/config/plans";
import * as api from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  let body: { plan: string };
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const plan = body.plan as keyof typeof PLANS;
  if (!PLANS[plan]) {
    return api.error("Invalid plan", 400);
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) return api.unauthorized();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await createCustomer(user.email, user.name);
    customerId = customer.id;
    user.stripeCustomerId = customerId;
    await user.save();
  }

  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    return api.error("Plan not configured", 500);
  }

  const checkoutSession = await createCheckoutSession(
    customerId,
    priceId,
    user._id.toString()
  );

  return api.success({ url: checkoutSession.url });
}
