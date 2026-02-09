import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddInstagramAccountDTO } from '@ghostgram/shared';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() data: { displayName?: string; locale?: string }
  ) {
    return this.usersService.updateProfile(user.id, data);
  }

  @Get('plan')
  async getPlanLimits(@CurrentUser() user: any) {
    return this.usersService.getPlanLimits(user.id);
  }

  @Get('instagram-accounts')
  async getInstagramAccounts(@CurrentUser() user: any) {
    return this.usersService.getInstagramAccounts(user.id);
  }

  @Post('instagram-accounts')
  async addInstagramAccount(
    @CurrentUser() user: any,
    @Body() dto: AddInstagramAccountDTO
  ) {
    return this.usersService.addInstagramAccount(user.id, dto);
  }

  @Delete('instagram-accounts/:accountId')
  async removeInstagramAccount(
    @CurrentUser() user: any,
    @Param('accountId') accountId: string
  ) {
    await this.usersService.removeInstagramAccount(user.id, accountId);
    return { message: 'Instagram account removed' };
  }
}
