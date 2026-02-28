# 构建阶段  
FROM node:22-alpine AS builder  
LABEL "language"="nodejs"  
LABEL "framework"="express"  
WORKDIR /src  
# 复制 package 文件  
COPY package*.json ./  
# 安装依赖  
RUN npm install  
# 复制源代码  
COPY . .  
# 构建 TypeScript  
RUN npm run build  
# 生成 Prisma Client  
RUN npm run prisma:generate  
# 运行阶段  
FROM node:22-alpine  
WORKDIR /src  
# 复制 package 文件  
COPY package*.json ./  
# 只安装生产依赖  
RUN npm install --only=production  
# 从构建阶段复制编译后的代码  
COPY --from=builder /src/dist ./dist  
# 复制 Prisma 相关文件  
COPY --from=builder /src/node_modules/.prisma ./node_modules/.prisma  
COPY --from=builder /src/prisma ./prisma  
# 暴露端口  
EXPOSE 8080  
# 启动应用  
CMD ["npm", "start"]  
