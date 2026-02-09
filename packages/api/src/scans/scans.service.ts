import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateScanDTO, ScanResultDTO } from '@ghostgram/shared';

@Injectable()
export class ScansService {
  constructor(private readonly prisma: PrismaService) {}

  async createScan(userId: string, dto: CreateScanDTO): Promise<ScanResultDTO> {
    // Verify account belongs to user
    const account = await this.prisma.instagramAccount.findFirst({
      where: { id: dto.accountId, userId }
    });

    if (!account) {
      throw new NotFoundException('Instagram account not found');
    }

    const scan = await this.prisma.scan.create({
      data: {
        accountId: dto.accountId,
        totalFollowing: dto.totalFollowing,
        nonFollowers: dto.nonFollowers,
        resultData: dto.resultData as any
      }
    });

    return this.mapScanToDTO(scan);
  }

  async getScans(userId: string, accountId?: string): Promise<ScanResultDTO[]> {
    const where: any = {};

    if (accountId) {
      // Verify account belongs to user
      const account = await this.prisma.instagramAccount.findFirst({
        where: { id: accountId, userId }
      });

      if (!account) {
        throw new NotFoundException('Instagram account not found');
      }

      where.accountId = accountId;
    } else {
      // Get all user's accounts
      const accounts = await this.prisma.instagramAccount.findMany({
        where: { userId },
        select: { id: true }
      });

      where.accountId = {
        in: accounts.map(a => a.id)
      };
    }

    const scans = await this.prisma.scan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return scans.map(scan => this.mapScanToDTO(scan));
  }

  async getScanById(userId: string, scanId: string): Promise<ScanResultDTO> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: { account: true }
    });

    if (!scan || scan.account.userId !== userId) {
      throw new NotFoundException('Scan not found');
    }

    return this.mapScanToDTO(scan);
  }

  async deleteScan(userId: string, scanId: string): Promise<void> {
    const scan = await this.prisma.scan.findUnique({
      where: { id: scanId },
      include: { account: true }
    });

    if (!scan || scan.account.userId !== userId) {
      throw new NotFoundException('Scan not found');
    }

    await this.prisma.scan.delete({
      where: { id: scanId }
    });
  }

  private mapScanToDTO(scan: any): ScanResultDTO {
    return {
      id: scan.id,
      accountId: scan.accountId,
      totalFollowing: scan.totalFollowing,
      nonFollowers: scan.nonFollowers,
      resultData: scan.resultData,
      createdAt: scan.createdAt.toISOString()
    };
  }
}
