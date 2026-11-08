import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  stripeInvoiceId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "refunded";
  plan: "starter" | "pro";
  periodStart?: Date;
  periodEnd?: Date;
  invoiceUrl?: string;
  invoicePdf?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    stripeInvoiceId: { type: String, unique: true },
    stripePaymentIntentId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["succeeded", "pending", "failed", "refunded"],
    },
    plan: { type: String, enum: ["starter", "pro"] },
    periodStart: Date,
    periodEnd: Date,
    invoiceUrl: String,
    invoicePdf: String,
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;
