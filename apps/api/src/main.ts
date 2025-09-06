import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import cors from '@fastify/cors';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );
    await app.register(cors, {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true); // curl / postman без Origin

            const allowed = [
                'http://localhost:5173',
                'https://lawlessly-sovereign-antelope.cloudpub.ru',
            ];

            const ok =
                allowed.includes(origin) ||
                /^https:\/\/t\.me$/.test(origin) ||
                /^https:\/\/web\.telegram\.org/.test(origin) ||
                /^https:\/\/(.+\.)?telegram\.org$/.test(origin) ||
                /^https:\/\/appassets\.androidplatform\.net$/.test(origin);

            if (ok) cb(null, true);
            else cb(new Error('Not allowed by CORS'), false);
        },
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-telegram-id',
            'x-tg-id',
            'x-telegram-web-app-init-data',
        ],
        credentials: false, // у нас нет cookies → false
        maxAge: 86400,
    });



  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
