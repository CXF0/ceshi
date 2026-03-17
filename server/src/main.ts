import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, isAbsolute } from 'path';
import { AppModule } from './app.module';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * 💡 动态路径适配逻辑：
   * 1. 优先读取 .env 中的 UPLOAD_PATH。
   * 2. 如果是绝对路径（如服务器配置），直接使用。
   * 3. 如果是相对路径（如本地 ./uploads），则相对于当前工作目录(process.cwd())解析。
   */
  const envUploadPath = process.env.UPLOAD_PATH || './uploads';
  const uploadDir = isAbsolute(envUploadPath)
    ? envUploadPath
    : join(process.cwd(), envUploadPath);

  // 自动检测并创建 uploads 文件夹，防止因为缺少目录启动失败
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 目录不存在，已自动创建: ${uploadDir}`);
  }

  // 核心配置：将物理目录映射到 URL 路径 /static/
  // 这样访问 http://domain.com/static/xxx.pdf 就能预览
  app.useStaticAssets(uploadDir, {
    prefix: '/static/', 
  });

  // 设置全局前缀，对应你 env 里的 GLOBAL_PREFIX
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX || 'api'); 

  // 允许跨域（本地开发预览 PDF 必选）
  app.enableCors(); 

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n--- 正达供应链系统环境诊断 ---`);
  console.log(`🚀 运行模式: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📂 资源目录: ${uploadDir}`);
  console.log(`🌐 接口地址: http://localhost:${port}/${process.env.GLOBAL_PREFIX || 'api'}`);
  console.log(`📄 预览前缀: http://localhost:${port}/static/`);
  console.log(`----------------------------\n`);
}
bootstrap();