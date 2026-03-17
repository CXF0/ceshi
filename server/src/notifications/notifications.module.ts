import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationTarget } from './entities/notification-target.entity';

@Module({
  // 💡 关键：注册实体，这样 TypeORM 才能在 Service 里通过 @InjectRepository 找到它们
  imports: [
    TypeOrmModule.forFeature([
      Notification, 
      NotificationTarget
    ])
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  // 如果其他模块（如定时任务模块）需要发送通知，可以将 Service 导出
  exports: [NotificationsService], 
})
export class NotificationsModule {}