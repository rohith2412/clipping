import { auth } from "@/auth";
import { listVoices } from "@/lib/integrations/elevenlabs";
import * as api from "@/lib/utils/api-response";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const voices = await listVoices();
  return api.success({ voices });
}
