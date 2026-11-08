import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import PlatformConnection from "@/lib/db/models/platform-connection.model";
import { encrypt } from "@/lib/utils/encryption";

type Ctx = { params: Promise<{ platform: string }> };

const TOKEN_ENDPOINTS: Record<string, string> = {
  youtube: "https://oauth2.googleapis.com/token",
  tiktok: "https://open.tiktokapis.com/v2/oauth/token/",
  instagram: "https://api.instagram.com/oauth/access_token",
};

const PROFILE_FETCHERS: Record<
  string,
  (accessToken: string) => Promise<{
    platformUserId: string;
    platformUsername: string;
    platformAvatar?: string;
  }>
> = {
  youtube: async (token) => {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const ch = data.items?.[0];
    return {
      platformUserId: ch?.id ?? "",
      platformUsername: ch?.snippet?.title ?? "",
      platformAvatar: ch?.snippet?.thumbnails?.default?.url,
    };
  },
  tiktok: async (token) => {
    const res = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const user = data.data?.user;
    return {
      platformUserId: user?.open_id ?? "",
      platformUsername: user?.display_name ?? "",
      platformAvatar: user?.avatar_url,
    };
  },
  instagram: async (token) => {
    const res = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${token}`
    );
    const data = await res.json();
    return {
      platformUserId: data.id ?? "",
      platformUsername: data.username ?? "",
    };
  },
};

export async function GET(req: NextRequest, ctx: Ctx) {
  const { platform } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const dashboardUrl = `${baseUrl}/platforms`;

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${dashboardUrl}?error=${error ?? "missing_code"}`
    );
  }

  let stateData: { userId: string; platform: string };
  try {
    stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8")
    );
  } catch {
    return NextResponse.redirect(`${dashboardUrl}?error=invalid_state`);
  }

  const redirectUri = `${baseUrl}/api/platforms/connect/${platform}/callback`;

  const clientSecrets: Record<string, { id: string; secret: string }> = {
    youtube: {
      id: process.env.YOUTUBE_CLIENT_ID ?? "",
      secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
    },
    tiktok: {
      id: process.env.TIKTOK_CLIENT_KEY ?? "",
      secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
    },
    instagram: {
      id: process.env.INSTAGRAM_APP_ID ?? "",
      secret: process.env.INSTAGRAM_APP_SECRET ?? "",
    },
  };

  const creds = clientSecrets[platform];
  if (!creds?.id) {
    return NextResponse.redirect(`${dashboardUrl}?error=not_configured`);
  }

  const tokenEndpoint = TOKEN_ENDPOINTS[platform];
  const tokenBody: Record<string, string> = {
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  if (platform === "tiktok") {
    tokenBody.client_key = creds.id;
    tokenBody.client_secret = creds.secret;
  } else {
    tokenBody.client_id = creds.id;
    tokenBody.client_secret = creds.secret;
  }

  let tokenRes: Response;
  try {
    tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenBody),
    });
  } catch {
    return NextResponse.redirect(`${dashboardUrl}?error=token_exchange_failed`);
  }

  const tokenData = await tokenRes.json();
  const accessToken =
    tokenData.access_token ?? tokenData.data?.access_token;
  const refreshToken =
    tokenData.refresh_token ?? tokenData.data?.refresh_token;
  const expiresIn =
    tokenData.expires_in ?? tokenData.data?.expires_in;

  if (!accessToken) {
    return NextResponse.redirect(`${dashboardUrl}?error=no_access_token`);
  }

  let profile = { platformUserId: "", platformUsername: "", platformAvatar: "" };
  try {
    profile = await PROFILE_FETCHERS[platform](accessToken) as any;
  } catch {
    // profile fetch is best-effort
  }

  await connectDB();

  const filter: Record<string, unknown> = { userId: stateData.userId, platform };
  await PlatformConnection.findOneAndUpdate(
    filter,
    {
      $set: {
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
        tokenExpiresAt: expiresIn
          ? new Date(Date.now() + expiresIn * 1000)
          : undefined,
        platformUserId: profile.platformUserId,
        platformUsername: profile.platformUsername,
        platformAvatar: profile.platformAvatar,
        isActive: true,
        connectedAt: new Date(),
        lastError: undefined,
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.redirect(`${dashboardUrl}?connected=${platform}`);
}
