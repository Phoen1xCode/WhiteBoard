# Multi-stage Dockerfile for WhiteBoard application

# ============================================
# Stage 1: Base image with dependencies
# ============================================
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# ============================================
# Stage 2: Install dependencies
# ============================================
FROM base AS deps

# Copy package files
COPY package.json yarn.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN yarn install --frozen-lockfile

# ============================================
# Stage 3: Build the web application
# ============================================
FROM base AS web-builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
# Skip copying shared node_modules as it has no dependencies

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY package.json yarn.lock ./

# Build arguments for environment variables
ARG VITE_API_BASE
ARG VITE_WS_URL

ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_WS_URL=${VITE_WS_URL}

# Build the web app
WORKDIR /app/apps/web
RUN yarn build

# ============================================
# Stage 4: Build the server application
# ============================================
FROM base AS server-builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
# Skip copying shared node_modules as it has no dependencies

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
COPY apps/server/prisma ./prisma
COPY package.json yarn.lock ./

# Generate Prisma client
WORKDIR /app/apps/server
RUN yarn prisma:generate

# ============================================
# Stage 5: Production server image
# ============================================
FROM base AS server

ENV NODE_ENV=production

# Copy built server and dependencies
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/apps/server ./apps/server
COPY --from=server-builder /app/packages/shared ./packages/shared
COPY --from=server-builder /app/apps/server/prisma ./prisma
COPY package.json ./

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/apps/server

EXPOSE 3000

CMD ["/entrypoint.sh"]

# ============================================
# Stage 6: Production web image (nginx)
# ============================================
FROM nginx:alpine AS web

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web app
COPY --from=web-builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
