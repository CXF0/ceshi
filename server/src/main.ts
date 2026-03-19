import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, isAbsolute, resolve } from 'path';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'fs';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * 💡 动态路径适配逻辑优化：
   * 1. 优先读取 .env 中的 UPLOAD_PATH。
   * 2. 自动识别平台：Windows(win32) 和 Mac(darwin) 开发环境下使用项目根目录。
   * 3. Linux 生产环境下如果未配置 ENV，则指向 /data/uploads。
   */
  const isDev = process.env.NODE_ENV !== 'production';
  const platform = os.platform();
  const isDesktop = platform === 'win32' || platform === 'darwin';

  // 优先级：ENV配置 > 桌面系统默认相对路径 > Linux默认绝对路径
  let envUploadPath = process.env.UPLOAD_PATH;
  if (!envUploadPath) {
    envUploadPath = isDesktop ? './uploads' : '/data/uploads';
  }

  const uploadDir = isAbsolute(envUploadPath)
    ? envUploadPath
    : resolve(process.cwd(), envUploadPath);

  // 自动检测并创建 uploads 文件夹，防止因为缺少目录启动失败
  if (!existsSync(uploadDir)) {
    try {
      mkdirSync(uploadDir, { recursive: true });
      console.log(`📁 目录不存在，已自动创建: ${uploadDir}`);
    } catch (err) {
      console.error(`❌ 无法创建目录 ${uploadDir}:`, err.message);
    }
  }

  // 核心配置：将物理目录映射到 URL 路径 /static/
  // 必须与 UploadController 返回的 URL 前缀 "/static/" 保持一致
  app.useStaticAssets(uploadDir, {
    prefix: '/static/',
    // 允许跨域请求静态资源（解决部分浏览器富文本图片跨域无法显示问题）
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
    },
  });

  // 设置全局前缀，对应你 env 里的 GLOBAL_PREFIX
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX || 'api'); 

  // 允许跨域（本地开发预览 PDF 及富文本上传必选）
  app.enableCors(); 

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n--- 正达供应链系统环境诊断 ---`);
  console.log(`🚀 运行模式: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💻 操作系统: ${platform}`);
  console.log(`📂 资源目录: ${uploadDir}`);
  console.log(`🌐 接口地址: http://localhost:${port}/${process.env.GLOBAL_PREFIX || 'api'}`);
  console.log(`📄 预览前缀: http://localhost:${port}/static/`);
  console.log(`----------------------------\n`);
}
bootstrap();