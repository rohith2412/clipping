import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlatformConnection extends Document {
  userId: mongoose.Types.ObjectId;
  platform: "youtube" | "tiktok" | "instagram";
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
  platformUserId?: string;
  platformUsername?: string;
  platformAvatar?: string;
  platformUrl?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  lastError?: string;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformConnectionSchema = new Schema<IPlatformConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: {
      type: String,
      enum: ["youtube", "tiktok", "instagram"],
      required: true,
    },
    accessToken: { type: String, required: true },
    refreshToken: String,
    tokenExpiresAt: Date,
    scopes: [String],
    platformUserId: String,
    platformUsername: String,
    platformAvatar: String,
    platformUrl: String,
    isActive: { type: Boolean, default: true },
    lastUsedAt: Date,
    lastError: String,
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PlatformConnectionSchema.index(
  { userId: 1, platform: 1 },
  { unique: true }
);

const PlatformConnection: Model<IPlatformConnection> =
  mongoose.models.PlatformConnection ||
  mongoose.model<IPlatformConnection>(
    "PlatformConnection",
    PlatformConnectionSchema
  );
export default PlatformConnection;
