import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  // Disable built-in body parser so Multer has full control over multipart/form-data
  // (default 100kb bodyParser limit was blocking large video uploads before they reached Multer)
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Re-enable body parser only for JSON/urlencoded — raw body for upload handled by Multer
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));

  // Gzip compression — reduces response sizes by ~60-80%
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS - Simple wildcard for maximum compatibility with Zalo Mini App WebViews
  // Note: We use Bearer token auth (not cookies), so credentials are NOT needed.
  // Using '*' ensures iOS WKWebView, Android WebView, and all browsers work correctly.
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Cache-Control'],
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

    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('docs', app as any, document);
  }

  const port = Number(process.env.PORT || process.env.API_PORT || 3001);
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
