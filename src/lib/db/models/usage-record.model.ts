import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUsageRecord extends Document {
  userId: mongoose.Types.ObjectId;
  type: "clip_generated" | "voiceover_generated" | "video_processed" | "publish";
  projectId?: mongoose.Types.ObjectId;
  clipId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UsageRecordSchema = new Schema<IUsageRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["clip_generated", "voiceover_generated", "video_processed", "publish"],
      required: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    clipId: { type: Schema.Types.ObjectId, ref: "Clip" },
    metadata: Schema.Types.Mixed,
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

UsageRecordSchema.index({ userId: 1, type: 1, createdAt: -1 });
UsageRecordSchema.index({ userId: 1, periodStart: 1, periodEnd: 1 });

const UsageRecord: Model<IUsageRecord> =
  mongoose.models.UsageRecord ||
  mongoose.model<IUsageRecord>("UsageRecord", UsageRecordSchema);
export default UsageRecord;
