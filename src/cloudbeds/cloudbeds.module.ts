import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { CloudbedsService } from './cloudbeds.service';
import { CloudbedsController } from './cloudbeds.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos
      maxRedirects: 5,
    }),
    ConfigModule,
    CacheModule.register({
      ttl: 300, // 5 minutos por defecto
      max: 100, // máximo 100 items en cache
    }),
  ],
  controllers: [CloudbedsController],
  providers: [CloudbedsService],
  exports: [CloudbedsService], // Exportar para usar en otros módulos
})
export class CloudbedsModule {}
