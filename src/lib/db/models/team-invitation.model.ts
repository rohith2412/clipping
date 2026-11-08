import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamInvitation extends Document {
  teamId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "expired" | "revoked";
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamInvitationSchema = new Schema<ITeamInvitation>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: { type: String, required: true, lowercase: true },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
    },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

TeamInvitationSchema.index({ token: 1 });
TeamInvitationSchema.index({ email: 1, teamId: 1 });

const TeamInvitation: Model<ITeamInvitation> =
  mongoose.models.TeamInvitation ||
  mongoose.model<ITeamInvitation>("TeamInvitation", TeamInvitationSchema);
export default TeamInvitation;
