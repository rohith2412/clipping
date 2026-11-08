import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  stripeSubscriptionId: string;
  stripePriceId: string;
  stripeProductId?: string;
  plan: "starter" | "pro";
  status:
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "unpaid"
    | "paused";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    stripePriceId: { type: String, required: true },
    stripeProductId: String,
    plan: {
      type: String,
      enum: ["starter", "pro"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "unpaid",
        "paused",
      ],
      required: true,
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: Date,
    trialEnd: Date,
  },
  { timestamps: true }
);

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;
