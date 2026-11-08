import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default("ClipEngine"),

  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),

  MONGODB_URI: z.string().min(1),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_STARTER: z.string().min(1),
  STRIPE_PRICE_PRO: z.string().min(1),

  DEEPGRAM_API_KEY: z.string().min(1),
  ELEVENLABS_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),

  YOUTUBE_CLIENT_ID: z.string().min(1),
  YOUTUBE_CLIENT_SECRET: z.string().min(1),

  TIKTOK_CLIENT_KEY: z.string().min(1),
  TIKTOK_CLIENT_SECRET: z.string().min(1),

  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),

  PLATFORM_TOKEN_ENCRYPTION_KEY: z.string().min(32),

  WORKER_CONCURRENCY_VIDEO: z.coerce.number().default(2),
  WORKER_CONCURRENCY_PUBLISH: z.coerce.number().default(10),
  WORKER_TEMP_DIR: z.string().default("/tmp/clipengine"),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    console.error(`Missing or invalid env vars: ${missing}`);
    throw new Error(`Missing or invalid env vars: ${missing}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getPublicEnv() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "ClipEngine",
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  };
}
