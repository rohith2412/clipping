import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import PlatformConnection from "@/lib/db/models/platform-connection.model";
import * as api from "@/lib/utils/api-response";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  await connectDB();

  const connections = await PlatformConnection.find({
    userId: session.user.id,
  })
    .select("-accessToken -refreshToken")
    .lean();

  return api.success({ connections });
}
