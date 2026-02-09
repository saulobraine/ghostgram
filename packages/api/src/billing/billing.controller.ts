import { Controller, Get, Post, Body, Headers, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCheckoutDTO } from '@ghostgram/shared';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@CurrentUser() user: any, @Body() dto: CreateCheckoutDTO) {
    return this.billingService.createCheckoutSession(user.id, dto);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(@CurrentUser() user: any) {
    return this.billingService.createPortalSession(user.id);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.id);
  }

  @Post('webhooks')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    await this.billingService.handleWebhook(signature, req.rawBody);
    return { received: true };
  }
}
