import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, getPlanFromPriceId } from "@/lib/integrations/stripe";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/user.model";
import Subscription from "@/lib/db/models/subscription.model";
import Payment from "@/lib/db/models/payment.model";
import { PLANS } from "@/lib/config/plans";

function getSubPeriod(sub: any): { start: Date; end: Date } {
  const s = sub.current_period_start ?? sub.billing_cycle_anchor;
  const e = sub.current_period_end ?? sub.cancel_at;
  return {
    start: new Date((typeof s === "number" ? s : 0) * 1000),
    end: new Date((typeof e === "number" ? e : 0) * 1000),
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscriptionId = session.subscription as string;
      const subRaw = await stripe.subscriptions.retrieve(subscriptionId);
      const sub = subRaw as any;
      const priceId = sub.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId);
      const planConfig = PLANS[plan];
      const period = getSubPeriod(sub);

      await Subscription.findOneAndUpdate(
        { userId },
        {
          userId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          stripeProductId: sub.items.data[0]?.price.product as string,
          plan,
          status: sub.status,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        { upsert: true, new: true }
      );

      await User.findByIdAndUpdate(userId, {
        plan,
        planStatus: sub.status === "active" ? "active" : "trialing",
        "usage.clipsLimit": planConfig.clipsPerMonth === Infinity ? 999999 : planConfig.clipsPerMonth,
        "usage.currentPeriodStart": period.start,
        "usage.currentPeriodEnd": period.end,
        onboardedAt: new Date(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as any;
      const userId = sub.metadata?.userId;
      if (!userId) break;

      const priceId = sub.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId);
      const planConfig = PLANS[plan];
      const period = getSubPeriod(sub);

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        {
          plan,
          stripePriceId: priceId,
          status: sub.status,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          canceledAt: sub.canceled_at
            ? new Date(sub.canceled_at * 1000)
            : undefined,
        }
      );

      const planStatus = ["active", "trialing"].includes(sub.status)
        ? "active"
        : sub.status === "past_due"
        ? "past_due"
        : "canceled";

      await User.findByIdAndUpdate(userId, {
        plan,
        planStatus,
        "usage.clipsLimit": planConfig.clipsPerMonth === Infinity ? 999999 : planConfig.clipsPerMonth,
        "usage.currentPeriodStart": period.start,
        "usage.currentPeriodEnd": period.end,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      const userId = sub.metadata?.userId;
      if (!userId) break;

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { status: "canceled", canceledAt: new Date() }
      );

      await User.findByIdAndUpdate(userId, {
        planStatus: "canceled",
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (!user) break;

      const paymentIntentId =
        typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id;

      await Payment.findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        {
          userId: user._id,
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: paymentIntentId,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: "succeeded",
          plan: user.plan,
          periodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000)
            : undefined,
          periodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000)
            : undefined,
          invoiceUrl: invoice.hosted_invoice_url ?? undefined,
          invoicePdf: invoice.invoice_pdf ?? undefined,
        },
        { upsert: true }
      );

      if (invoice.billing_reason === "subscription_cycle") {
        await User.findByIdAndUpdate(user._id, {
          "usage.clipsGenerated": 0,
          "usage.voiceoversGenerated": 0,
          "usage.videosProcessed": 0,
          "usage.currentPeriodStart": invoice.period_start
            ? new Date(invoice.period_start * 1000)
            : undefined,
          "usage.currentPeriodEnd": invoice.period_end
            ? new Date(invoice.period_end * 1000)
            : undefined,
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const customerId = invoice.customer as string;

      const user = await User.findOne({ stripeCustomerId: customerId });
      if (!user) break;

      await Payment.findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        {
          userId: user._id,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: "failed",
          plan: user.plan,
        },
        { upsert: true }
      );

      await User.findByIdAndUpdate(user._id, {
        planStatus: "past_due",
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
