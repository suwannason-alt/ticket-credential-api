/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SaveAppLog } from './utils/logger';
import { Logger } from '@nestjs/common';
import { ExceptionHandle } from './utils/exceptionHandler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new SaveAppLog(AppModule.name),
  });
  app.useGlobalFilters(
    new ExceptionHandle(new SaveAppLog('GlobalExceptionHandle')),
  );
  await app.listen(process.env.PORT ?? 3000);
  Logger.log(
    `Application is running on: ${process.env.PORT ?? 3000}`,
    'bootstrap',
  );
}
bootstrap();
