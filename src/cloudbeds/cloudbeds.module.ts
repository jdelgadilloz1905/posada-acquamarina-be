import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudbedsService } from './cloudbeds.service';
import { CloudbedsController } from './cloudbeds.controller';
import { Room } from '../rooms/entities/room.entity';
import { Client } from '../clients/entities/client.entity';
import { Reservation } from '../reservations/entities/reservation.entity';

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
    TypeOrmModule.forFeature([Room, Client, Reservation]),
  ],
  controllers: [CloudbedsController],
  providers: [CloudbedsService],
  exports: [CloudbedsService], // Exportar para usar en otros módulos
})
export class CloudbedsModule {}
