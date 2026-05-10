# --- ETAPA 1: Construcción ---
FROM node:20-alpine AS builder
WORKDIR /app

# Corregido: --no-cache es el parámetro correcto para Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Instalamos dependencias y generamos el cliente Prisma para Linux
RUN npm install --legacy-peer-deps
RUN npx prisma generate

COPY . .
RUN npm run build

# --- ETAPA 2: Producción ---
FROM node:20-alpine AS runner
WORKDIR /app

# Instalamos openssl también en la imagen final
RUN apk add --no-cache openssl

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Exponemos el puerto interno del contenedor
EXPOSE 4000

# Ejecutamos la aplicación desde el directorio dist
CMD ["node", "dist/main.js"]