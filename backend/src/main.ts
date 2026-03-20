import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  // Serve the uploads folder statically
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  //console.log(`🚀 Backend running on http://localhost:${port}/api`);

  const uploadsPath = join(process.cwd(), 'uploads');

  //console.log('Serving static files from:', uploadsPath);
  //console.log('--- DEBUG: STATIC ASSETS ---');
  //console.log('Current Working Directory:', process.cwd());
  //console.log('Attempting to serve uploads from:', uploadsPath);
  // console.log('---------------------------');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads', // Remove the trailing slash here to see if it helps
  });

  app.enableCors();
}
bootstrap();
