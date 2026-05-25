import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthResponseDTO, UserDTO, Plan } from '@ghostgram/shared';
import { RegisterDto } from './dto/RegisterDto';
import { LoginDto } from './dto/LoginDto';

interface RefreshTokenPayload {
  sub?: string;
  sid?: string;
  typ?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDTO> {
    const email = dto.email.trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName?.trim() || null,
        locale: dto.locale?.trim() || 'pt-BR'
      }
    });

    const tokens = await this.createSessionAndTokens(user.id, user.email);

    return {
      ...tokens,
      user: this.mapUserToDTO(user)
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDTO> {
    const email = dto.email.trim();
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.createSessionAndTokens(user.id, user.email);

    return {
      ...tokens,
      user: this.mapUserToDTO(user)
    };
  }

  async getMe(userId: string): Promise<UserDTO> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToDTO(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDTO> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET')
      });

      if (payload.typ !== 'refresh' || !payload.sub || !payload.sid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const session = await this.prisma.authSession.findUnique({
        where: { id: payload.sid }
      });

      if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (!isRefreshTokenValid) {
        await this.revokeSession(session.id);
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: session.userId }
      });

      if (!user) {
        await this.revokeSession(session.id);
        throw new UnauthorizedException('User not found');
      }

      await this.revokeSession(session.id);
      const tokens = await this.createSessionAndTokens(user.id, user.email);

      return {
        ...tokens,
        user: this.mapUserToDTO(user)
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId }
    });
  }

  private async createSessionAndTokens(userId: string, email: string) {
    const sessionId = randomUUID();
    const accessTokenExpiresIn = this.config.get('JWT_EXPIRES_IN', '15m');
    const refreshTokenExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN', '30d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, sid: sessionId, typ: 'access' },
        {
          secret: this.config.get('JWT_SECRET'),
          expiresIn: accessTokenExpiresIn
        }
      ),
      this.jwtService.signAsync(
        { sub: userId, email, sid: sessionId, typ: 'refresh' },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: refreshTokenExpiresIn
        }
      )
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash,
        expiresAt: this.getExpirationDate(refreshTokenExpiresIn)
      }
    });

    return { accessToken, refreshToken };
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date()
      }
    });
  }

  private getExpirationDate(expiresIn: string | number): Date {
    return new Date(Date.now() + this.parseExpirationToMs(expiresIn));
  }

  private parseExpirationToMs(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn * 1000;
    }

    if (/^\d+$/.test(expiresIn)) {
      return Number(expiresIn) * 1000;
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/i);
    if (!match) {
      throw new Error(`Unsupported JWT expiration format: ${expiresIn}`);
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (unit === 's') {
      return amount * 1000;
    }

    if (unit === 'm') {
      return amount * 60 * 1000;
    }

    if (unit === 'h') {
      return amount * 60 * 60 * 1000;
    }

    return amount * 24 * 60 * 60 * 1000;
  }

  private mapUserToDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? undefined,
      locale: user.locale,
      plan: this.mapPlan(user.plan),
      createdAt: user.createdAt.toISOString()
    };
  }

  private mapPlan(plan: string): Plan {
    return plan === Plan.PREMIUM ? Plan.PREMIUM : Plan.FREE;
  }
}
