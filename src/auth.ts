import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import authConfig from "./auth.config";

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.plan = dbUser.plan;
          token.planStatus = dbUser.planStatus;
          token.teamId = dbUser.teamId?.toString();
          token.teamRole = dbUser.teamRole;
          token.role = dbUser.role;
          token.onboardedAt = dbUser.onboardedAt?.toISOString();
        }
      }

      if (trigger === "update" && session) {
        if (session.plan) token.plan = session.plan;
        if (session.planStatus) token.planStatus = session.planStatus;
        if (session.teamId) token.teamId = session.teamId;
        if (session.onboardedAt) token.onboardedAt = session.onboardedAt;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.plan = token.plan;
      session.user.planStatus = token.planStatus;
      session.user.teamId = token.teamId;
      session.user.teamRole = token.teamRole;
      session.user.role = token.role;
      (session.user as unknown as Record<string, unknown>).onboardedAt = token.onboardedAt;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await connectDB();
      const dbUser = await User.findOne({ email: user.email });
      if (!dbUser) return;

      const isAdmin = user.email === "rohithra75@gmail.com";
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      if (isAdmin) {
        dbUser.role = "admin";
        dbUser.plan = "pro";
        dbUser.planStatus = "active";
        dbUser.onboardedAt = now;
      }

      dbUser.usage = {
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        clipsGenerated: 0,
        clipsLimit: isAdmin ? 999999 : 100,
        voiceoversGenerated: 0,
        videosProcessed: 0,
      };
      dbUser.preferences = {
        defaultCaptionStyle: "burned-in",
        defaultPlatforms: ["youtube"],
        timezone: "UTC",
        emailNotifications: {
          processingComplete: true,
          publishSuccess: true,
          publishFailure: true,
          weeklyDigest: true,
        },
      };
      await dbUser.save();
    },
  },
});
