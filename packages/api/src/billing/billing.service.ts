import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import Stripe from 'stripe';
import { CreateCheckoutDTO, CheckoutResponseDTO, SubscriptionDTO } from '@ghostgram/shared';

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

  async createCheckoutSession(userId: string, dto: CreateCheckoutDTO): Promise<CheckoutResponseDTO> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create Stripe customer
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

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: this.config.get('STRIPE_PREMIUM_PRICE_ID'),
          quantity: 1
        }
      ],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: { userId }
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
      return_url: this.config.get('FRONTEND_URL')
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
      stripeSubId: subscription.stripeSubId,
      plan: subscription.plan,
      status: subscription.status,
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
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata.userId;
    
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

    if (sub) {
      const status = subscription.status === 'active' ? 'ACTIVE' : 
                     subscription.status === 'canceled' ? 'CANCELLED' :
                     subscription.status === 'past_due' ? 'PAST_DUE' : 'EXPIRED';

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { 
          status,
          expiresAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
        }
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findUnique({
      where: { stripeSubId: subscription.id }
    });

    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' }
      });

      await this.prisma.user.update({
        where: { id: sub.userId },
        data: { plan: 'FREE' }
      });
    }
  }
}
