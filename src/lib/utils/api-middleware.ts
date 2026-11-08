import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import * as api from "./api-response";

type RouteContext = { params: Promise<Record<string, string>> };

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: RouteContext,
  session: Session
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    const session = await auth();
    if (!session?.user?.id) {
      return api.unauthorized();
    }
    return handler(req, ctx, session);
  };
}

export function withSubscription(
  handler: AuthenticatedHandler,
  requiredPlan?: "starter" | "pro"
) {
  return withAuth(async (req, ctx, session) => {
    if (!["active", "trialing"].includes(session.user.planStatus)) {
      return api.forbidden("Active subscription required");
    }
    if (requiredPlan === "pro" && session.user.plan !== "pro") {
      return api.forbidden("Pro plan required");
    }
    return handler(req, ctx, session);
  });
}

export function withUsageCheck(handler: AuthenticatedHandler) {
  return withAuth(async (req, ctx, session) => {
    await connectDB();
    const user = await User.findById(session.user.id).select("usage plan").lean();
    if (!user) return api.unauthorized();

    if (
      user.plan === "starter" &&
      user.usage.clipsGenerated >= user.usage.clipsLimit
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Monthly clip limit reached",
            code: "USAGE_LIMIT_EXCEEDED",
            current: user.usage.clipsGenerated,
            limit: user.usage.clipsLimit,
          },
        },
        { status: 429 }
      );
    }
    return handler(req, ctx, session);
  });
}

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (
    req: NextRequest,
    ctx: RouteContext,
    session: Session,
    data: T
  ) => Promise<NextResponse>
) {
  return withAuth(async (req, ctx, session) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return api.error("Invalid JSON body", 400, "INVALID_JSON");
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return api.validationError(
        result.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    return handler(req, ctx, session, result.data);
  });
}

export function withTeamAccess(handler: AuthenticatedHandler) {
  return withSubscription(async (req, ctx, session) => {
    if (!session.user.teamId) {
      return api.forbidden("No team associated");
    }
    return handler(req, ctx, session);
  }, "pro");
}
