import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeam extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  members: {
    userId: mongoose.Types.ObjectId;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
  }[];
  maxMembers: number;
  settings: {
    sharedProjects: boolean;
    sharedSchedule: boolean;
    sharedPlatforms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    maxMembers: { type: Number, default: 5 },
    settings: {
      sharedProjects: { type: Boolean, default: true },
      sharedSchedule: { type: Boolean, default: true },
      sharedPlatforms: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
export default Team;
