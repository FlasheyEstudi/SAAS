# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiamos solo lo necesario del builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001
ENV PORT=3001

# Script para correr migraciones y optimizar SQLite antes de arrancar
CMD npx prisma db push && \
    node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$executeRawUnsafe('PRAGMA journal_mode=WAL;').then(() => console.log('WAL Enabled'))" && \
    node server.js
