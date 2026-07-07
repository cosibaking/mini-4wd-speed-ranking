# 微信云托管镜像：多阶段构建，最终仅含生产依赖 + 编译产物
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY db ./db
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 微信云托管默认服务端口 80，后端通过 PORT 读取
ENV PORT=80
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 80
CMD ["./docker-entrypoint.sh"]
