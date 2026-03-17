import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  Param, 
  UseGuards, 
  BadRequestException, 
  InternalServerErrorException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ensureDir } from 'fs-extra';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

// 💡 解决 TS 命名空间报错的关键导入
import type { Express } from 'express';
import 'multer';

@Controller('common')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('upload/:folder')
  @UseInterceptors(FileInterceptor('file')) 
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Param('folder') folder: string
  ) {
    if (!file) {
      throw new BadRequestException('未接收到文件');
    }

    try {
      // 💡 自动识别环境：
      // Windows (本地开发): 使用项目根目录下的 uploads 文件夹
      // Linux (ECS 生产): 使用 /data/uploads 文件夹
      const isWin = os.platform() === 'win32';
      const rootDir = isWin 
        ? join(process.cwd(), 'uploads') 
        : '/data/uploads';

      const targetDir = join(rootDir, folder);
      
      // 💡 确保物理目录存在，如果不存在则自动创建
      await ensureDir(targetDir);

      // 生成唯一文件名，防止重名覆盖
      const ext = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${ext}`;
      const fullPath = join(targetDir, fileName);

      // 💡 将文件 Buffer 写入硬盘
      await writeFile(fullPath, file.buffer);

      // 根据环境返回不同的访问域名
      const baseUrl = isWin ? 'http://localhost:3000' : 'https://zhengdatong.cn';
      
      return {
        url: `${baseUrl}/static/${folder}/${fileName}`,
        name: file.originalname
      };
    } catch (error: any) {
      // 在后端终端打印详细日志，方便调试权限或路径问题
      console.error('======== 上传过程崩溃日志 ========');
      console.error(error);
      console.error('================================');
      throw new InternalServerErrorException(`服务器内部错误: ${error.message}`);
    }
  }
}