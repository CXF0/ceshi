@echo off
set SERVER_IP=121.43.138.82
set REMOTE_PATH=/www/wwwroot/zhengdatong-backend

echo [1/4] Building project...
call npm run build

echo [2/4] Compiling and Packaging...
:: 压缩 dist 文件夹和 package 文件，这样上传只有一个文件，极快
tar -czf release.tar.gz dist package.json package-lock.json

echo [3/4] Uploading to Aliyun...
:: 上传压缩包
scp release.tar.gz root@%SERVER_IP%:%REMOTE_PATH%/

echo [4/4] Remote deploying...
:: 远程解压、安装依赖（如果有新包）、重启服务
ssh root@%SERVER_IP% "cd %REMOTE_PATH% && tar -xzf release.tar.gz && npm install --production && (pm2 restart zhengdatong-server || pm2 start dist/main.js --name zhengdatong-server)"

echo [5/5] Cleaning up...
del release.tar.gz

echo Done! Project is live at https://zhengdatong.cn
pause