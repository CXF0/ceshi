# Zhengdatong Server (NestJS)

## 1. 安装依赖

```bash
npm install
```

## 2. 环境变量配置（必须）

复制示例文件并填写真实配置：

```bash
cp .env.example .env
```

必填项：

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`

> 安全要求：禁止把真实密码、JWT secret 提交到 Git 仓库。

## 3. 启动

```bash
# development
npm run start:dev

# production
npm run build
npm run start:prod
```

## 4. 密钥轮换与 Token 失效策略

### 4.1 轮换步骤

1. 生成新数据库密码与新 `JWT_SECRET`。
2. 在部署环境更新 `.env`（先灰度环境，再生产环境）。
3. 重启服务，验证新 token 可正常签发与鉴权。

### 4.2 已发 Token 失效策略

- JWT 使用单一 `JWT_SECRET` 签名。
- 当 `JWT_SECRET` 轮换后，旧 secret 签发的 token 将立即失效（强制重新登录）。
- 建议在业务低峰窗口执行，并提前公告用户会话失效影响。

## 5. 常用脚本

```bash
npm run lint
npm run test
npm run test:e2e
```
