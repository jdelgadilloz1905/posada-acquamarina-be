import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncLog } from './entities/sync-log.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudbedsModule } from '../cloudbeds/cloudbeds.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncLog]),
    NotificationsModule,
    CloudbedsModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
