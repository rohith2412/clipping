import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPublishLog extends Document {
  userId: mongoose.Types.ObjectId;
  clipId: mongoose.Types.ObjectId;
  scheduleId?: mongoose.Types.ObjectId;
  platform: "youtube" | "tiktok" | "instagram";
  action: "publish" | "retry" | "delete";
  status: "initiated" | "uploading" | "processing" | "published" | "failed";
  platformPostId?: string;
  platformUrl?: string;
  error?: {
    code?: string;
    message?: string;
    raw?: unknown;
  };
  durationMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PublishLogSchema = new Schema<IPublishLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clipId: {
      type: Schema.Types.ObjectId,
      ref: "Clip",
      required: true,
    },
    scheduleId: { type: Schema.Types.ObjectId, ref: "Schedule" },
    platform: {
      type: String,
      enum: ["youtube", "tiktok", "instagram"],
      required: true,
    },
    action: {
      type: String,
      enum: ["publish", "retry", "delete"],
      required: true,
    },
    status: {
      type: String,
      enum: ["initiated", "uploading", "processing", "published", "failed"],
    },
    platformPostId: String,
    platformUrl: String,
    error: {
      code: String,
      message: String,
      raw: Schema.Types.Mixed,
    },
    durationMs: Number,
  },
  { timestamps: true }
);

PublishLogSchema.index({ clipId: 1, platform: 1 });
PublishLogSchema.index({ userId: 1, createdAt: -1 });

const PublishLog: Model<IPublishLog> =
  mongoose.models.PublishLog ||
  mongoose.model<IPublishLog>("PublishLog", PublishLogSchema);
export default PublishLog;
