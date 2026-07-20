# =====================================================================
# NMS Web Next - 多阶段构建 Dockerfile
# =====================================================================
# 阶段一：构建
# --------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖（利用 Docker 缓存）
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# 复制源码并构建
COPY . .
RUN npm run build

# =====================================================================
# 阶段二：运行（nginx 托管静态资源）
# --------------------------------------------------------------------
FROM nginx:alpine AS runner

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O- http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
