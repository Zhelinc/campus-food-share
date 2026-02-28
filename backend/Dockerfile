FROM node:22 AS builder  
LABEL "language"="nodejs"  
WORKDIR /src  
COPY package*.json ./  
RUN npm install  
COPY . .  
RUN rm -rf node_modules/.prisma  # 删除旧的 Prisma 缓存  
RUN npm run build  
RUN npm run prisma:generate  
FROM node:22  
LABEL "language"="nodejs"  
WORKDIR /src  
COPY package*.json ./  
RUN npm install --omit=dev  
COPY --from=builder /src/dist ./dist  
COPY --from=builder /src/node_modules/.prisma ./node_modules/.prisma  
COPY --from=builder /src/node_modules/@prisma ./node_modules/@prisma  
COPY --from=builder /src/prisma ./prisma  
EXPOSE 8080  
CMD ["node", "dist/index.js"]  
