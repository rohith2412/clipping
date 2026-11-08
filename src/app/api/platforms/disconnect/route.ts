import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import PlatformConnection from "@/lib/db/models/platform-connection.model";
import * as api from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  let body: any;
  try {
    body = await req.json();
  } catch {
    return api.error("Invalid request body", 400);
  }

  const { platform } = body;
  if (!platform) return api.error("platform is required", 400);

  await connectDB();

  const result = await PlatformConnection.findOneAndDelete({
    userId: session.user.id,
    platform,
  });

  if (!result) return api.notFound("Connection");
  return api.success({ disconnected: platform });
}
