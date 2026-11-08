import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClip extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sourceStartTime: number;
  sourceEndTime: number;
  duration: number;
  title?: string;
  description?: string;
  hashtags: string[];
  transcript?: string;
  category?: string;
  renditions: {
    platform: "youtube" | "tiktok" | "instagram" | "universal";
    s3Key: string;
    width?: number;
    height?: number;
    fileSize?: number;
    codec?: string;
    fps?: number;
    format: string;
  }[];
  voiceover: {
    enabled: boolean;
    voiceId?: string;
    script?: string;
    audioS3Key?: string;
    duration?: number;
    status: "pending" | "generating" | "ready" | "failed";
  };
  captions: {
    style: "none" | "burned-in" | "srt";
    srtS3Key?: string;
    fontFamily: string;
    fontSize: number;
    position: "top" | "center" | "bottom";
    color: string;
    bgColor: string;
    bgOpacity: number;
  };
  status: "generating" | "ready" | "published" | "failed" | "archived";
  publishHistory: {
    platform: "youtube" | "tiktok" | "instagram";
    publishedAt?: Date;
    platformPostId?: string;
    platformUrl?: string;
    status: "pending" | "uploading" | "processing" | "published" | "failed";
    error?: string;
  }[];
  metrics: {
    youtube?: { views: number; likes: number; comments: number; shares: number };
    tiktok?: { views: number; likes: number; comments: number; shares: number };
    instagram?: { views: number; likes: number; comments: number; shares: number };
    lastSyncedAt?: Date;
  };
  isApproved: boolean;
  isFavorite: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClipSchema = new Schema<IClip>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sourceStartTime: { type: Number, required: true },
    sourceEndTime: { type: Number, required: true },
    duration: { type: Number, required: true },

    title: String,
    description: String,
    hashtags: [String],
    transcript: String,
    category: String,

    renditions: [
      {
        platform: {
          type: String,
          enum: ["youtube", "tiktok", "instagram", "universal"],
        },
        s3Key: { type: String, required: true },
        width: Number,
        height: Number,
        fileSize: Number,
        codec: String,
        fps: Number,
        format: { type: String, default: "mp4" },
      },
    ],

    voiceover: {
      enabled: { type: Boolean, default: false },
      voiceId: String,
      script: String,
      audioS3Key: String,
      duration: Number,
      status: {
        type: String,
        enum: ["pending", "generating", "ready", "failed"],
        default: "pending",
      },
    },

    captions: {
      style: {
        type: String,
        enum: ["none", "burned-in", "srt"],
        default: "burned-in",
      },
      srtS3Key: String,
      fontFamily: { type: String, default: "Inter" },
      fontSize: { type: Number, default: 24 },
      position: {
        type: String,
        enum: ["top", "center", "bottom"],
        default: "bottom",
      },
      color: { type: String, default: "#FFFFFF" },
      bgColor: { type: String, default: "#000000" },
      bgOpacity: { type: Number, default: 0.7 },
    },

    status: {
      type: String,
      enum: ["generating", "ready", "published", "failed", "archived"],
      default: "generating",
    },

    publishHistory: [
      {
        platform: {
          type: String,
          enum: ["youtube", "tiktok", "instagram"],
        },
        publishedAt: Date,
        platformPostId: String,
        platformUrl: String,
        status: {
          type: String,
          enum: ["pending", "uploading", "processing", "published", "failed"],
        },
        error: String,
      },
    ],

    metrics: {
      youtube: {
        views: Number,
        likes: Number,
        comments: Number,
        shares: Number,
      },
      tiktok: {
        views: Number,
        likes: Number,
        comments: Number,
        shares: Number,
      },
      instagram: {
        views: Number,
        likes: Number,
        comments: Number,
        shares: Number,
      },
      lastSyncedAt: Date,
    },

    isApproved: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ClipSchema.index({ projectId: 1, sortOrder: 1 });
ClipSchema.index({ userId: 1, status: 1 });
ClipSchema.index({
  "publishHistory.platform": 1,
  "publishHistory.status": 1,
});

const Clip: Model<IClip> =
  mongoose.models.Clip || mongoose.model<IClip>("Clip", ClipSchema);
export default Clip;
