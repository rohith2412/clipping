import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import Team from "@/lib/db/models/team.model";
import TeamInvitation from "@/lib/db/models/team-invitation.model";
import User from "@/lib/db/models/user.model";
import crypto from "crypto";
import * as api from "@/lib/utils/api-response";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();
  const user = await User.findById(session.user.id).select("teamId").lean();
  if (!user?.teamId) return api.error("No team found", 404);

  const invitations = await TeamInvitation.find({
    teamId: user.teamId,
    status: "pending",
  }).lean();

  return api.success({ invitations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const { email, role = "member" } = body;
  if (!email) return api.error("Email is required", 400);

  await connectDB();

  const user = await User.findById(session.user.id)
    .select("teamId teamRole")
    .lean();
  if (!user?.teamId) return api.error("No team found", 404);

  if (!["owner", "admin"].includes(user.teamRole ?? "")) {
    return api.error("Only owners and admins can invite members", 403);
  }

  const team = await Team.findById(user.teamId);
  if (!team) return api.notFound("Team");

  if (team.members.length >= (team.maxMembers ?? 10)) {
    return api.error("Team member limit reached", 400);
  }

  const existing = await TeamInvitation.findOne({
    teamId: user.teamId,
    email,
    status: "pending",
  });
  if (existing) return api.error("Invitation already sent", 400);

  const token = crypto.randomBytes(32).toString("hex");
  const invitation = await TeamInvitation.create({
    teamId: user.teamId,
    email,
    role,
    invitedBy: session.user.id,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "pending",
  });

  return api.success(invitation, 201);
}
