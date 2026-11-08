import connectDB from "@/lib/db/connection";
import * as api from "@/lib/utils/api-response";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    api: "ok",
    database: "error",
  };

  try {
    await connectDB();
    checks.database = "ok";
  } catch {
    // database is down
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return api.success(
    { status: allOk ? "healthy" : "degraded", checks },
    allOk ? 200 : 503
  );
}
