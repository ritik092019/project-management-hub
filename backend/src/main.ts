import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit for image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for Swagger UI compatibility
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Set global API route prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS with strict origin checking
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
  });

  // Enable Global Pipes, Filters, and Interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Configure Swagger / OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Team Project Hub API')
    .setDescription(
      'REST API backend foundation for Team Project Hub featuring users, teams, projects, technologies, analytics, collaboration tools, real-time notifications, and GitHub integration.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`🚀 NestJS Backend server listening on port http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger API Documentation available at http://localhost:${port}/api/docs`);
  logger.log(`💚 System Health check endpoint at http://localhost:${port}/${apiPrefix}/health`);
}

bootstrap();
