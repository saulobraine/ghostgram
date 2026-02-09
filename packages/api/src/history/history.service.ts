import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateActionDTO, SyncActionsDTO, ActionHistoryDTO, ActionStatsDTO } from '@ghostgram/shared';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async syncActions(userId: string, dto: SyncActionsDTO): Promise<{ synced: number }> {
    // Verify account belongs to user
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: dto.accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    // Bulk insert actions
    await this.prisma.actionHistory.createMany({
      data: dto.actions.map(action => ({
        accountId: dto.accountId,
        actionType: action.actionType,
        targetUsername: action.targetUsername,
        source: action.source || 'manual',
        metadata: action.metadata as any,
        timestamp: new Date()
      })),
      skipDuplicates: true
    });

    return { synced: dto.actions.length };
  }

  async getActions(userId: string, accountId?: string): Promise<ActionHistoryDTO[]> {
    const where: any = {};

    if (accountId) {
      const account = await this.prisma.instagramAccount.findFirst({
        where: { id: accountId, userId }
      });

      if (!account) {
        throw new NotFoundException('Instagram account not found');
      }

      where.accountId = accountId;
    } else {
      const accounts = await this.prisma.instagramAccount.findMany({
        where: { userId },
        select: { id: true }
      });

      where.accountId = { in: accounts.map(a => a.id) };
    }

    const actions = await this.prisma.actionHistory.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return actions.map(action => ({
      id: action.id,
      accountId: action.accountId,
      actionType: action.actionType as any,
      targetUsername: action.targetUsername,
      source: action.source,
      metadata: action.metadata,
      timestamp: action.timestamp.toISOString()
    }));
  }

  async getStats(userId: string, accountId: string): Promise<ActionStatsDTO> {
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    const [total, last24h] = await Promise.all([
      this.prisma.actionHistory.groupBy({
        by: ['actionType'],
        where: { accountId },
        _count: true
      }),
      this.prisma.actionHistory.groupBy({
        by: ['actionType'],
        where: {
          accountId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        _count: true
      })
    ]);

    const totalCounts = total.reduce((acc, item) => {
      acc[item.actionType] = item._count;
      return acc;
    }, {} as any);

    const last24hCounts = last24h.reduce((acc, item) => {
      acc[item.actionType] = item._count;
      return acc;
    }, {} as any);

    return {
      totalActions: Number(Object.values(totalCounts).reduce((sum: number, count: any) => sum + count, 0)),
      follows: totalCounts['follow'] || 0,
      unfollows: totalCounts['unfollow'] || 0,
      scans: totalCounts['scan'] || 0,
      last24Hours: {
        follows: last24hCounts['follow'] || 0,
        unfollows: last24hCounts['unfollow'] || 0,
        scans: last24hCounts['scan'] || 0
      }
    };
  }

  async deleteHistory(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    await this.prisma.actionHistory.deleteMany({
      where: { accountId }
    });
  }
}
