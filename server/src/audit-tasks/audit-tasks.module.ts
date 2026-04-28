import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditTask } from './audit-task.entity';
import { AuditTasksService } from './audit-tasks.service';
import { AuditTasksController } from './audit-tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditTask])],
  controllers: [AuditTasksController],
  providers: [AuditTasksService],
  exports: [AuditTasksService],
})
export class AuditTasksModule {}