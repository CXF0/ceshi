@echo off
set SERVER_IP=121.43.138.82
set REMOTE_PATH=/www/wwwroot/zhengdatong-web

echo [1/4] Building Frontend project...
call npm run build || (echo "❌ Build failed" && pause && exit /b)

echo [2/4] Packaging...
:: 💡 重点：删除旧包，进入 dist 目录打包，避免路径嵌套问题
if exist web-dist.tar.gz del web-dist.tar.gz
:: 使用简洁的 tar 命令
tar -czf web-dist.tar.gz dist

echo [3/4] Uploading to Aliyun...
:: 💡 确保远程目录存在 (如果第一次部署)
ssh root@%SERVER_IP% "mkdir -p %REMOTE_PATH%"
scp web-dist.tar.gz root@%SERVER_IP%:%REMOTE_PATH%/

echo [4/4] Remote deploying...
:: 💡 这里的逻辑是：解压后，把包里的 dist 文件夹内容移动到根目录
ssh root@%SERVER_IP% "cd %REMOTE_PATH% && tar -xzf web-dist.tar.gz && cp -r dist/* . && rm -rf dist && echo 'Deploy Success!'"

echo [5/5] Cleaning up...
del web-dist.tar.gz

echo Done! Website is updated.
pause