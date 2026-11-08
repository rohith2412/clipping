import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { PLATFORMS } from "@/lib/config/platforms";
import * as api from "@/lib/utils/api-response";

type Ctx = { params: Promise<{ platform: string }> };

const OAUTH_CONFIGS: Record<string, {
  authUrl: string;
  scopes: string[];
  extraParams?: Record<string, string>;
}> = {
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
  },
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_show_list",
      "pages_read_engagement",
    ],
  },
};

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return api.unauthorized();

  const { platform } = await ctx.params;

  if (!PLATFORMS.includes(platform as any)) {
    return api.error("Invalid platform", 400);
  }

  const config = OAUTH_CONFIGS[platform];
  if (!config) return api.error("Platform not configured", 400);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const redirectUri = `${baseUrl}/api/platforms/connect/${platform}/callback`;

  const clientIds: Record<string, string | undefined> = {
    youtube: process.env.YOUTUBE_CLIENT_ID,
    tiktok: process.env.TIKTOK_CLIENT_KEY,
    instagram: process.env.INSTAGRAM_APP_ID,
  };

  const clientId = clientIds[platform];
  if (!clientId) return api.error("Platform credentials not configured", 500);

  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id, platform })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(platform === "tiktok" ? "," : " "),
    state,
    ...config.extraParams,
  });

  return api.success({
    url: `${config.authUrl}?${params.toString()}`,
  });
}
