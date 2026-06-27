# 多阶段构建：Next.js standalone 输出
# 用法：docker build -t knowledge-reader . && docker run -p 3000:3000 knowledge-reader

# ============ 依赖安装阶段 ============
FROM node:22-alpine AS deps
WORKDIR /app

# 复制 package 文件，利用缓存层
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ============ 构建阶段 ============
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 环境变量占位（构建时只需公开变量，真实密钥运行时注入）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_MOCK_AUTH=false

RUN npm run build

# ============ 运行阶段 ============
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制构建产物（standalone 输出）
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
