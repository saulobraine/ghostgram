import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SyncActionsDTO } from '@ghostgram/shared';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post('sync')
  async syncActions(@CurrentUser() user: any, @Body() dto: SyncActionsDTO) {
    return this.historyService.syncActions(user.id, dto);
  }

  @Get()
  async getActions(@CurrentUser() user: any, @Query('accountId') accountId?: string) {
    return this.historyService.getActions(user.id, accountId);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any, @Query('accountId') accountId: string) {
    return this.historyService.getStats(user.id, accountId);
  }

  @Delete()
  async deleteHistory(@CurrentUser() user: any, @Query('accountId') accountId: string) {
    await this.historyService.deleteHistory(user.id, accountId);
    return { message: 'History cleared' };
  }
}
