import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HistoryModule } from './history/history.module';
import { ScansModule } from './scans/scans.module';
import { WhitelistModule } from './whitelist/whitelist.module';
import { BillingModule } from './billing/billing.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100 // 100 requests per minute
      }
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    HistoryModule,
    ScansModule,
    WhitelistModule,
    BillingModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
