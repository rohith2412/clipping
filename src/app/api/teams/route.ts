import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Team from "@/lib/db/models/team.model";
import User from "@/lib/db/models/user.model";
import * as api from "@/lib/utils/api-response";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();

  const user = await User.findById(session.user.id).select("teamId").lean();
  if (!user?.teamId) return api.success({ team: null });

  const team = await Team.findById(user.teamId).lean();
  return api.success({ team });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  if (session.user.plan !== "pro") {
    return api.error("Teams require a Pro subscription", 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const { name } = body;
  if (!name) return api.error("Team name is required", 400);

  await connectDB();

  const existingUser = await User.findById(session.user.id)
    .select("teamId")
    .lean();
  if (existingUser?.teamId) {
    return api.error("You already belong to a team", 400);
  }

  const team = await Team.create({
    name,
    ownerId: session.user.id,
    members: [
      {
        userId: session.user.id,
        role: "owner",
        joinedAt: new Date(),
      },
    ],
    settings: {
      defaultPlatforms: ["youtube"],
      sharedProjects: true,
    },
  });

  await User.findByIdAndUpdate(session.user.id, {
    teamId: team._id,
    teamRole: "owner",
  });

  return api.success(team, 201);
}
