import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true
  }))

  app.useGlobalFilters(new GlobalExceptionFilter());
  
  const config = new DocumentBuilder()
    .setTitle('URL Shortener API')
    .setDescription('API for shortening and resolving URLs')
    .setVersion('1.0')
    .addServer('http://localhost:4001')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
