import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import * as api from "@/lib/utils/api-response";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("preferences name email image")
    .lean();

  if (!user) return api.notFound("User");
  return api.success(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const allowed = [
    "preferences.defaultVoiceId",
    "preferences.captionStyle",
    "preferences.platforms",
    "preferences.timezone",
    "preferences.emailNotifications",
    "name",
  ];

  const update: Record<string, any> = {};
  for (const key of allowed) {
    const shortKey = key.split(".").pop()!;
    if (body[shortKey] !== undefined) {
      update[key] = body[shortKey];
    }
  }

  if (body.preferences) {
    for (const [k, v] of Object.entries(body.preferences)) {
      const fullKey = `preferences.${k}`;
      if (allowed.includes(fullKey)) {
        update[fullKey] = v;
      }
    }
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    session.user.id,
    { $set: update },
    { new: true }
  ).select("preferences name email image");

  if (!user) return api.notFound("User");
  return api.success(user);
}
