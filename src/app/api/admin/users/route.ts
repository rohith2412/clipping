import { NextRequest } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import * as api from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return api.forbidden();
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const search = searchParams.get("search");

  const query: Record<string, any> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v")
      .lean(),
    User.countDocuments(query),
  ]);

  return api.success({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
