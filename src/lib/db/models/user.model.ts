import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  stripeCustomerId?: string;
  subscriptionId?: mongoose.Types.ObjectId;
  plan: "starter" | "pro";
  planStatus: "active" | "past_due" | "canceled" | "trialing";
  teamId?: mongoose.Types.ObjectId;
  teamRole?: "owner" | "admin" | "member";
  usage: {
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    clipsGenerated: number;
    clipsLimit: number;
    voiceoversGenerated: number;
    videosProcessed: number;
  };
  preferences: {
    defaultVoiceId?: string;
    defaultCaptionStyle: "none" | "burned-in" | "srt";
    defaultPlatforms: string[];
    timezone: string;
    emailNotifications: {
      processingComplete: boolean;
      publishSuccess: boolean;
      publishFailure: boolean;
      weeklyDigest: boolean;
    };
  };
  lastLoginAt?: Date;
  onboardedAt?: Date;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: { type: Date },
    image: { type: String },

    stripeCustomerId: { type: String, unique: true, sparse: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription" },
    plan: {
      type: String,
      enum: ["starter", "pro"],
      default: "starter",
    },
    planStatus: {
      type: String,
      enum: ["active", "past_due", "canceled", "trialing"],
      default: "active",
    },

    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    teamRole: { type: String, enum: ["owner", "admin", "member"] },

    usage: {
      currentPeriodStart: { type: Date },
      currentPeriodEnd: { type: Date },
      clipsGenerated: { type: Number, default: 0 },
      clipsLimit: { type: Number, default: 100 },
      voiceoversGenerated: { type: Number, default: 0 },
      videosProcessed: { type: Number, default: 0 },
    },

    preferences: {
      defaultVoiceId: { type: String },
      defaultCaptionStyle: {
        type: String,
        enum: ["none", "burned-in", "srt"],
        default: "burned-in",
      },
      defaultPlatforms: [
        { type: String, enum: ["youtube", "tiktok", "instagram"] },
      ],
      timezone: { type: String, default: "UTC" },
      emailNotifications: {
        processingComplete: { type: Boolean, default: true },
        publishSuccess: { type: Boolean, default: true },
        publishFailure: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
      },
    },

    lastLoginAt: { type: Date },
    onboardedAt: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ stripeCustomerId: 1 });
UserSchema.index({ teamId: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
