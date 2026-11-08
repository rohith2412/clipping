import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchedule extends Document {
  userId: mongoose.Types.ObjectId;
  clipId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  scheduledFor: Date;
  timezone: string;
  platforms: ("youtube" | "tiktok" | "instagram")[];
  platformConfig: {
    youtube?: {
      title?: string;
      description?: string;
      tags?: string[];
      visibility: "public" | "unlisted" | "private";
      categoryId?: string;
    };
    tiktok?: {
      title?: string;
      description?: string;
      hashtags?: string[];
      privacyLevel: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
      disableComment: boolean;
      disableDuet: boolean;
      disableStitch: boolean;
    };
    instagram?: {
      caption?: string;
      hashtags?: string[];
      coverImageS3Key?: string;
    };
  };
  status:
    | "scheduled"
    | "publishing"
    | "published"
    | "partially_published"
    | "failed"
    | "canceled";
  results: {
    platform: string;
    status: "pending" | "publishing" | "published" | "failed";
    platformPostId?: string;
    platformUrl?: string;
    publishedAt?: Date;
    error?: string;
  }[];
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clipId: {
      type: Schema.Types.ObjectId,
      ref: "Clip",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    scheduledFor: { type: Date, required: true, index: true },
    timezone: { type: String, required: true },
    platforms: [
      {
        type: String,
        enum: ["youtube", "tiktok", "instagram"],
        required: true,
      },
    ],

    platformConfig: {
      youtube: {
        title: String,
        description: String,
        tags: [String],
        visibility: {
          type: String,
          enum: ["public", "unlisted", "private"],
          default: "public",
        },
        categoryId: String,
      },
      tiktok: {
        title: String,
        description: String,
        hashtags: [String],
        privacyLevel: {
          type: String,
          enum: [
            "PUBLIC_TO_EVERYONE",
            "MUTUAL_FOLLOW_FRIENDS",
            "SELF_ONLY",
          ],
          default: "PUBLIC_TO_EVERYONE",
        },
        disableComment: { type: Boolean, default: false },
        disableDuet: { type: Boolean, default: false },
        disableStitch: { type: Boolean, default: false },
      },
      instagram: {
        caption: String,
        hashtags: [String],
        coverImageS3Key: String,
      },
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "publishing",
        "published",
        "partially_published",
        "failed",
        "canceled",
      ],
      default: "scheduled",
    },

    results: [
      {
        platform: String,
        status: {
          type: String,
          enum: ["pending", "publishing", "published", "failed"],
        },
        platformPostId: String,
        platformUrl: String,
        publishedAt: Date,
        error: String,
      },
    ],

    jobId: String,
  },
  { timestamps: true }
);

ScheduleSchema.index({ scheduledFor: 1, status: 1 });
ScheduleSchema.index({ userId: 1, scheduledFor: -1 });

const Schedule: Model<ISchedule> =
  mongoose.models.Schedule ||
  mongoose.model<ISchedule>("Schedule", ScheduleSchema);
export default Schedule;
