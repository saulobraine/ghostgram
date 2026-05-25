import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import Stripe from 'stripe';
import { CheckoutResponseDTO, SubscriptionDTO, Plan, SubscriptionStatus } from '@ghostgram/shared';
import { CreateCheckoutDto } from './dto/CreateCheckoutDto';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16'
    });
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutDto): Promise<CheckoutResponseDTO> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let customerId: string;
    const existingSub = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (existingSub) {
      customerId = existingSub.stripeCustomerId;
    } else {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: this.getPriceIdForPlan(dto.plan),
          quantity: 1
        }
      ],
      success_url: this.buildFrontendUrl('/billing/success'),
      cancel_url: this.buildFrontendUrl('/billing/cancel'),
      metadata: { userId, plan: dto.plan }
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id
    };
  }

  async createPortalSession(userId: string): Promise<{ portalUrl: string }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: this.buildFrontendUrl('/settings/billing')
    });

    return { portalUrl: session.url };
  }

  async getSubscription(userId: string): Promise<SubscriptionDTO | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.id,
      userId: subscription.userId,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubId: subscription.stripeSubId ?? undefined,
      plan: this.mapPlan(subscription.plan),
      status: this.mapSubscriptionStatus(subscription.status),
      expiresAt: subscription.expiresAt?.toISOString(),
      createdAt: subscription.createdAt.toISOString()
    };
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        return;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        return;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        return;
      default:
        return;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) {
      return;
    }

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubId: session.subscription as string,
        plan: 'PREMIUM',
        status: 'ACTIVE'
      },
      update: {
        stripeSubId: session.subscription as string,
        plan: 'PREMIUM',
        status: 'ACTIVE'
      }
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: 'PREMIUM' }
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findUnique({
      where: { stripeSubId: subscription.id }
    });

    if (!sub) {
      return;
    }

    const status = subscription.status === 'active'
      ? 'ACTIVE'
      : subscription.status === 'canceled'
        ? 'CANCELLED'
        : subscription.status === 'past_due'
          ? 'PAST_DUE'
          : 'EXPIRED';

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status,
        expiresAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
      }
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findUnique({
      where: { stripeSubId: subscription.id }
    });

    if (!sub) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'EXPIRED' }
    });

    await this.prisma.user.update({
      where: { id: sub.userId },
      data: { plan: 'FREE' }
    });
  }

  private getPriceIdForPlan(plan: Plan): string {
    if (plan === Plan.PREMIUM) {
      return this.config.get('STRIPE_PREMIUM_PRICE_ID');
    }

    throw new NotFoundException('Unsupported plan');
  }

  private buildFrontendUrl(pathname: string): string {
    const frontendUrl = this.config.get('FRONTEND_URL');
    return new URL(pathname, frontendUrl).toString();
  }

  private mapPlan(plan: string): Plan {
    return plan === Plan.PREMIUM ? Plan.PREMIUM : Plan.FREE;
  }

  private mapSubscriptionStatus(status: string): SubscriptionStatus {
    if (status === SubscriptionStatus.CANCELLED) {
      return SubscriptionStatus.CANCELLED;
    }

    if (status === SubscriptionStatus.EXPIRED) {
      return SubscriptionStatus.EXPIRED;
    }

    if (status === SubscriptionStatus.PAST_DUE) {
      return SubscriptionStatus.PAST_DUE;
    }

    return SubscriptionStatus.ACTIVE;
  }
}
