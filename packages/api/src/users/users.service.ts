import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AddInstagramAccountDTO, UserDTO, InstagramAccountDTO, PlanLimitsDTO, PLAN_LIMITS } from '@ghostgram/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserDTO> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToDTO(user);
  }

  async updateProfile(userId: string, data: { displayName?: string; locale?: string }): Promise<UserDTO> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data
    });

    return this.mapUserToDTO(user);
  }

  async getInstagramAccounts(userId: string): Promise<InstagramAccountDTO[]> {
    const accounts = await this.prisma.instagramAccount.findMany({
      where: { userId }
    });

    return accounts.map(acc => ({
      id: acc.id,
      igUsername: acc.igUsername,
      igUserId: acc.igUserId,
      createdAt: acc.createdAt.toISOString()
    }));
  }

  async addInstagramAccount(userId: string, dto: AddInstagramAccountDTO): Promise<InstagramAccountDTO> {
    // Check limits
    const limits = await this.getPlanLimits(userId);
    if (limits.currentUsage.instagramAccountsCount >= limits.maxInstagramAccounts) {
      throw new BadRequestException('Instagram account limit reached');
    }

    const account = await this.prisma.instagramAccount.create({
      data: {
        userId,
        igUsername: dto.igUsername,
        igUserId: dto.igUserId
      }
    });

    return {
      id: account.id,
      igUsername: account.igUsername,
      igUserId: account.igUserId,
      createdAt: account.createdAt.toISOString()
    };
  }

  async removeInstagramAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    await this.prisma.instagramAccount.delete({
      where: { id: accountId }
    });
  }

  async getPlanLimits(userId: string): Promise<PlanLimitsDTO> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        instagramAccounts: {
          include: {
            scans: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24h
                }
              }
            },
            whitelistEntries: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const limits = PLAN_LIMITS[user.plan];
    const scansToday = user.instagramAccounts.reduce((sum, acc) => sum + acc.scans.length, 0);
    const whitelistCount = user.instagramAccounts.reduce((sum, acc) => sum + acc.whitelistEntries.length, 0);

    return {
      scansPerDay: limits.SCANS_PER_DAY,
      unfollowPerSession: limits.UNFOLLOW_PER_SESSION,
      historyRetentionDays: limits.HISTORY_RETENTION_DAYS,
      maxWhitelist: limits.MAX_WHITELIST,
      maxInstagramAccounts: limits.MAX_INSTAGRAM_ACCOUNTS,
      currentUsage: {
        scansToday,
        unfollowsThisSession: 0, // TODO: track in session
        whitelistCount,
        instagramAccountsCount: user.instagramAccounts.length
      }
    };
  }

  private mapUserToDTO(user: any): UserDTO {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      locale: user.locale,
      plan: user.plan,
      createdAt: user.createdAt.toISOString()
    };
  }
}
