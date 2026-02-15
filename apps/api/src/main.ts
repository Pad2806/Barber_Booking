import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: (requestOrigin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3005',
        'http://127.0.0.1:3005',
        process.env.WEB_URL,
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!requestOrigin) {
        console.log('[CORS] Allowing request with no origin');
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(requestOrigin)) {
        console.log('[CORS] Allowing origin from allowed list:', requestOrigin);
        return callback(null, true);
      }

      // Allow Zalo Mini App domains and schemes
      if (
        requestOrigin.startsWith('https://h5.zalo.me') ||
        requestOrigin.startsWith('http://h5.zalo.me') ||
        requestOrigin.startsWith('zbrowser://') ||
        requestOrigin.includes('zalo.me') ||
        requestOrigin.includes('zadn.vn')
      ) {
        console.log('[CORS] Allowing Zalo origin:', requestOrigin);
        return callback(null, true);
      }

      // In development/testing, allow all origins and log them
      if (process.env.NODE_ENV !== 'production') {
        console.log('[CORS] DEV MODE - Allowing origin:', requestOrigin);
        return callback(null, true);
      }

      // Log blocked origin for debugging
      console.warn('[CORS] BLOCKED origin:', requestOrigin);

      // Instead of throwing error, just return false to block
      callback(null, false);
    },
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ReetroBarberShop API')
      .setDescription('API documentation for ReetroBarberShop booking system')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('salons', 'Salon management')
      .addTag('services', 'Service management')
      .addTag('staff', 'Staff management')
      .addTag('bookings', 'Booking management')
      .addTag('payments', 'Payment processing')
      .addTag('reviews', 'Reviews and ratings')
      .addTag('admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.PORT || process.env.API_PORT || 3001);
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
