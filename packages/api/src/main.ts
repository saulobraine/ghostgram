import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for extension and app
  app.enableCors({
    origin: [
      'chrome-extension://*',
      'http://localhost:3000',
      'http://localhost:19006', // Expo dev server
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 GhostGram API running on: http://localhost:${port}/api/v1`);
}

bootstrap();
