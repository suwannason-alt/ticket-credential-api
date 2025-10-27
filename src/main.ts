/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SaveAppLog } from './utils/logger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ExceptionHandle } from './utils/exceptionHandler';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new SaveAppLog(AppModule.name),
    bufferLogs: true,
  });

  app.use(helmet());
  app.setGlobalPrefix(`/api/v1`);
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors();
  app.useGlobalFilters(
    new ExceptionHandle(new SaveAppLog('GlobalExceptionHandle')),
  );

  const config = new DocumentBuilder()
    .setTitle('Credential API')
    .setDescription('The API for create and verify credential.')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/swagger', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
  Logger.log(
    `Application is running on: ${process.env.PORT ?? 3000}`,
    'bootstrap',
  );
}
bootstrap();
