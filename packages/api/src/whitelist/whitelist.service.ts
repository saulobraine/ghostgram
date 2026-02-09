import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AddToWhitelistDTO, SyncWhitelistDTO, WhitelistEntryDTO } from '@ghostgram/shared';

@Injectable()
export class WhitelistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWhitelist(userId: string, accountId: string): Promise<WhitelistEntryDTO[]> {
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    const entries = await this.prisma.whitelistEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' }
    });

    return entries.map(entry => ({
      id: entry.id,
      accountId: entry.accountId,
      igUsername: entry.igUsername,
      createdAt: entry.createdAt.toISOString()
    }));
  }

  async addToWhitelist(userId: string, dto: AddToWhitelistDTO): Promise<WhitelistEntryDTO> {
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: dto.accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    try {
      const entry = await this.prisma.whitelistEntry.create({
        data: {
          accountId: dto.accountId,
          igUsername: dto.igUsername
        }
      });

      return {
        id: entry.id,
        accountId: entry.accountId,
        igUsername: entry.igUsername,
        createdAt: entry.createdAt.toISOString()
      };
    } catch (error) {
      throw new ConflictException('Username already in whitelist');
    }
  }

  async removeFromWhitelist(userId: string, accountId: string, username: string): Promise<void> {
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    await this.prisma.whitelistEntry.deleteMany({
      where: {
        accountId,
        igUsername: username
      }
    });
  }

  async syncWhitelist(userId: string, dto: SyncWhitelistDTO): Promise<{ synced: number }> {
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: dto.accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    // Delete all existing entries
    await this.prisma.whitelistEntry.deleteMany({
      where: { accountId: dto.accountId }
    });

    // Create new entries
    if (dto.usernames.length > 0) {
      await this.prisma.whitelistEntry.createMany({
        data: dto.usernames.map(username => ({
          accountId: dto.accountId,
          igUsername: username
        })),
        skipDuplicates: true
      });
    }

    return { synced: dto.usernames.length };
  }
}
