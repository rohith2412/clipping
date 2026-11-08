import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: "starter" | "pro";
      planStatus: "active" | "past_due" | "canceled" | "trialing";
      teamId?: string;
      teamRole?: "owner" | "admin" | "member";
      role: "user" | "admin";
      onboardedAt?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    plan?: "starter" | "pro";
    planStatus?: "active" | "past_due" | "canceled" | "trialing";
    teamId?: string;
    teamRole?: "owner" | "admin" | "member";
    role?: "user" | "admin";
    onboardedAt?: Date;
    stripeCustomerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    plan: "starter" | "pro";
    planStatus: "active" | "past_due" | "canceled" | "trialing";
    teamId?: string;
    teamRole?: "owner" | "admin" | "member";
    role: "user" | "admin";
    onboardedAt?: string;
  }
}
