import { z } from "zod";

const youtubeUrlRegex =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;

export const createProjectSchema = z.object({
  sourceUrl: z
    .string()
    .url("Please enter a valid URL")
    .regex(youtubeUrlRegex, "Must be a valid YouTube URL"),
  config: z
    .object({
      maxClips: z.number().min(1).max(30).default(15),
      minClipDuration: z.number().min(10).max(120).default(15),
      maxClipDuration: z.number().min(15).max(180).default(60),
      targetPlatforms: z
        .array(z.enum(["youtube", "tiktok", "instagram"]))
        .min(1, "Select at least one platform")
        .default(["youtube"]),
      voiceoverEnabled: z.boolean().default(false),
      voiceId: z.string().optional(),
      captionStyle: z.enum(["none", "burned-in", "srt"]).default("burned-in"),
    })
    .optional(),
});

export const updateClipSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  hashtags: z.array(z.string().max(50)).max(30).optional(),
  sourceStartTime: z.number().min(0).optional(),
  sourceEndTime: z.number().min(0).optional(),
  captions: z
    .object({
      style: z.enum(["none", "burned-in", "srt"]).optional(),
      fontFamily: z.string().optional(),
      fontSize: z.number().min(12).max(48).optional(),
      position: z.enum(["top", "center", "bottom"]).optional(),
      color: z.string().optional(),
      bgColor: z.string().optional(),
      bgOpacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export const createScheduleSchema = z.object({
  clipId: z.string().min(1),
  projectId: z.string().min(1),
  scheduledFor: z.string().datetime(),
  timezone: z.string().min(1),
  platforms: z
    .array(z.enum(["youtube", "tiktok", "instagram"]))
    .min(1, "Select at least one platform"),
  platformConfig: z
    .object({
      youtube: z
        .object({
          title: z.string().max(100).optional(),
          description: z.string().max(5000).optional(),
          tags: z.array(z.string()).optional(),
          visibility: z.enum(["public", "unlisted", "private"]).default("public"),
        })
        .optional(),
      tiktok: z
        .object({
          title: z.string().max(150).optional(),
          description: z.string().max(2200).optional(),
          hashtags: z.array(z.string()).optional(),
          privacyLevel: z
            .enum(["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"])
            .default("PUBLIC_TO_EVERYONE"),
          disableComment: z.boolean().default(false),
          disableDuet: z.boolean().default(false),
          disableStitch: z.boolean().default(false),
        })
        .optional(),
      instagram: z
        .object({
          caption: z.string().max(2200).optional(),
          hashtags: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro"]),
});

export const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateClipInput = z.infer<typeof updateClipSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
