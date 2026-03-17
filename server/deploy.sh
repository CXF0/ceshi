#!/bin/bash

# 配置信息
SERVER_USER="root"
SERVER_IP="121.43.138.82"
SERVER_PATH="/www/wwwroot/zhengdatong-backend"
PM2_NAME="zhengdatong-server"

echo "开始构建..."
npm run build

# 检查 build 是否成功
if [ $? -ne 0 ]; then
    echo "构建失败，请检查代码"
    exit 1
fi

echo "正在同步文件到服务器..."
# 注意：Windows 下使用 rsync 需要 Git Bash 环境，Trae 的终端默认通常是 PowerShell 或 CMD
# 如果你没有 rsync，这里改用 scp 比较稳妥
scp -r ./dist ./package.json ./package-lock.json $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo "正在重启 PM2..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && pm2 reload $PM2_NAME || pm2 start dist/main.js --name $PM2_NAME"

echo "🚀 部署成功！"