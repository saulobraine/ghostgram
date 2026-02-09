import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ScansService } from './scans.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateScanDTO } from '@ghostgram/shared';

@Controller('scans')
@UseGuards(JwtAuthGuard)
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  async createScan(@CurrentUser() user: any, @Body() dto: CreateScanDTO) {
    return this.scansService.createScan(user.id, dto);
  }

  @Get()
  async getScans(@CurrentUser() user: any, @Query('accountId') accountId?: string) {
    return this.scansService.getScans(user.id, accountId);
  }

  @Get(':id')
  async getScanById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.scansService.getScanById(user.id, id);
  }

  @Delete(':id')
  async deleteScan(@CurrentUser() user: any, @Param('id') id: string) {
    await this.scansService.deleteScan(user.id, id);
    return { message: 'Scan deleted' };
  }
}
