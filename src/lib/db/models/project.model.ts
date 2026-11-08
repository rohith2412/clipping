import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  sourceUrl: string;
  sourceProvider: "youtube";
  videoMetadata: {
    title?: string;
    description?: string;
    channelName?: string;
    channelId?: string;
    thumbnailUrl?: string;
    duration?: number;
    publishedAt?: Date;
    viewCount?: number;
    tags?: string[];
  };
  status:
    | "pending"
    | "downloading"
    | "transcribing"
    | "analyzing"
    | "generating_clips"
    | "post_processing"
    | "completed"
    | "failed"
    | "partially_failed";
  pipeline: {
    currentStep: number;
    totalSteps: number;
    stepName?: string;
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    error?: {
      step: string;
      message: string;
      code: string;
      retries: number;
    };
  };
  storage: {
    rawVideoKey?: string;
    audioKey?: string;
    transcriptKey?: string;
    rawVideoSize?: number;
  };
  transcript: {
    fullText?: string;
    segments: {
      start: number;
      end: number;
      text: string;
      confidence: number;
      speaker?: string;
    }[];
    language?: string;
  };
  peakMoments: {
    startTime: number;
    endTime: number;
    score: number;
    reason: string;
    transcript: string;
    category: string;
    selected: boolean;
  }[];
  config: {
    maxClips: number;
    minClipDuration: number;
    maxClipDuration: number;
    targetPlatforms: string[];
    voiceoverEnabled: boolean;
    voiceId?: string;
    captionStyle: "none" | "burned-in" | "srt";
  };
  clipCount: number;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },

    sourceUrl: { type: String, required: true },
    sourceProvider: {
      type: String,
      enum: ["youtube"],
      default: "youtube",
    },
    videoMetadata: {
      title: String,
      description: String,
      channelName: String,
      channelId: String,
      thumbnailUrl: String,
      duration: Number,
      publishedAt: Date,
      viewCount: Number,
      tags: [String],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "downloading",
        "transcribing",
        "analyzing",
        "generating_clips",
        "post_processing",
        "completed",
        "failed",
        "partially_failed",
      ],
      default: "pending",
    },

    pipeline: {
      currentStep: { type: Number, default: 0 },
      totalSteps: { type: Number, default: 7 },
      stepName: String,
      progress: { type: Number, default: 0, min: 0, max: 100 },
      startedAt: Date,
      completedAt: Date,
      error: {
        step: String,
        message: String,
        code: String,
        retries: { type: Number, default: 0 },
      },
    },

    storage: {
      rawVideoKey: String,
      audioKey: String,
      transcriptKey: String,
      rawVideoSize: Number,
    },

    transcript: {
      fullText: String,
      segments: [
        {
          start: Number,
          end: Number,
          text: String,
          confidence: Number,
          speaker: String,
        },
      ],
      language: String,
    },

    peakMoments: [
      {
        startTime: { type: Number, required: true },
        endTime: { type: Number, required: true },
        score: Number,
        reason: String,
        transcript: String,
        category: {
          type: String,
          enum: [
            "emotional",
            "informational",
            "controversial",
            "funny",
            "actionable",
            "quotable",
          ],
        },
        selected: { type: Boolean, default: true },
      },
    ],

    config: {
      maxClips: { type: Number, default: 15 },
      minClipDuration: { type: Number, default: 15 },
      maxClipDuration: { type: Number, default: 60 },
      targetPlatforms: [
        { type: String, enum: ["youtube", "tiktok", "instagram"] },
      ],
      voiceoverEnabled: { type: Boolean, default: false },
      voiceId: String,
      captionStyle: {
        type: String,
        enum: ["none", "burned-in", "srt"],
        default: "burned-in",
      },
    },

    clipCount: { type: Number, default: 0 },
    jobId: String,
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ teamId: 1, createdAt: -1 });

const Project: Model<IProject> =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
export default Project;
