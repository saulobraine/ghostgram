import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddToWhitelistDTO, SyncWhitelistDTO } from '@ghostgram/shared';

@Controller('whitelist')
@UseGuards(JwtAuthGuard)
export class WhitelistController {
  constructor(private readonly whitelistService: WhitelistService) {}

  @Get()
  async getWhitelist(@CurrentUser() user: any, @Query('accountId') accountId: string) {
    return this.whitelistService.getWhitelist(user.id, accountId);
  }

  @Post()
  async addToWhitelist(@CurrentUser() user: any, @Body() dto: AddToWhitelistDTO) {
    return this.whitelistService.addToWhitelist(user.id, dto);
  }

  @Delete(':username')
  async removeFromWhitelist(
    @CurrentUser() user: any,
    @Query('accountId') accountId: string,
    @Param('username') username: string
  ) {
    await this.whitelistService.removeFromWhitelist(user.id, accountId, username);
    return { message: 'Removed from whitelist' };
  }

  @Post('sync')
  async syncWhitelist(@CurrentUser() user: any, @Body() dto: SyncWhitelistDTO) {
    return this.whitelistService.syncWhitelist(user.id, dto);
  }
}
