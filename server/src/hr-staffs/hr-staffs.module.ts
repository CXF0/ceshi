import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrStaff } from './hr-staff.entity';
import { HrStaffsService } from './hr-staffs.service';
import { HrStaffsController } from './hr-staffs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HrStaff])],
  controllers: [HrStaffsController],
  providers: [HrStaffsService],
  exports: [HrStaffsService],
})
export class HrStaffsModule {}