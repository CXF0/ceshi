/**
 * @file server/src/common/upload.controller.ts
 * @version 2.1.0 [2026-05-03]
 * @desc 修复：统一返回 { code, data: { url, name } } 结构，与其他接口一致
 *       支持子目录上传：/api/common/upload/:folder
 *       folder 可传：contracts / certificates / invoices / notice-content 等
 */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ensureDir } from 'fs-extra';
import { join, isAbsolute, resolve } from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

import type { Express } from 'express';
import 'multer';

@Controller('common')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('upload/:folder')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('未接收到文件');
    }

    try {
      const platform = os.platform();
      const isDesktop = platform === 'win32' || platform === 'darwin';

      let envUploadPath = process.env.UPLOAD_PATH;
      if (!envUploadPath) {
        envUploadPath = isDesktop ? './uploads' : '/www/wwwroot/zhengdatong-backend/uploads';
      }

      const rootDir = isAbsolute(envUploadPath)
        ? envUploadPath
        : resolve(process.cwd(), envUploadPath);

      const targetDir = join(rootDir, folder);

      // 自动创建目录（含子目录）
      await ensureDir(targetDir);

      const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
      const fileName = `${uuidv4()}.${ext}`;
      const fullPath = join(targetDir, fileName);

      await writeFile(fullPath, file.buffer);

      // 根据环境返回不同域名
      const baseUrl = isDesktop ? 'http://localhost:3000' : 'https://zhengdatong.cn';
      const url = `${baseUrl}/static/${folder}/${fileName}`;

      // ✅ 统一包装为 { code, data: { url, name } }，与其他接口保持一致
      return {
        code: 200,
        msg: '上传成功',
        data: {
          url,
          name: file.originalname,
          size: file.size,
        },
      };
    } catch (error: any) {
      console.error('======== 上传过程崩溃日志 ========');
      console.error(error);
      console.error('================================');
      throw new InternalServerErrorException(`上传失败: ${error.message}`);
    }
  }
}