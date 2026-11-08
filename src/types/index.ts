export type { PlanId } from "@/lib/config/plans";
export type { Platform } from "@/lib/config/platforms";

export type ProjectStatus =
  | "pending"
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "generating_clips"
  | "post_processing"
  | "completed"
  | "failed"
  | "partially_failed";

export type ClipStatus =
  | "generating"
  | "ready"
  | "published"
  | "failed"
  | "archived";

export type ScheduleStatus =
  | "scheduled"
  | "publishing"
  | "published"
  | "partially_published"
  | "failed"
  | "canceled";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "unpaid"
  | "paused";

export type TeamRole = "owner" | "admin" | "member";
export type UserRole = "user" | "admin";
export type CaptionStyle = "none" | "burned-in" | "srt";

export type PeakCategory =
  | "emotional"
  | "informational"
  | "controversial"
  | "funny"
  | "actionable"
  | "quotable";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker?: string;
}

export interface PeakMoment {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  transcript: string;
  category: PeakCategory;
  selected: boolean;
}

export interface PipelineState {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: {
    step: string;
    message: string;
    code: string;
    retries: number;
  };
}
