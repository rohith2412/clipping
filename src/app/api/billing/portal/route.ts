import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import { createPortalSession } from "@/lib/integrations/stripe";
import * as api from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();
  const user = await User.findById(session.user.id).select("stripeCustomerId");
  if (!user?.stripeCustomerId) {
    return api.error("No billing account found", 400);
  }

  const portalSession = await createPortalSession(user.stripeCustomerId);
  return api.success({ url: portalSession.url });
}
