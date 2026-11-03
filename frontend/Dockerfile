# ==============================================================================
# NAGARDRISHTI — FRONTEND PRODUCTION DOCKERFILE
# Multi-stage Vite React build served via optimized Alpine Nginx
# ==============================================================================

# Stage 1: Build production assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:1.25-alpine

# Copy built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy production nginx configuration for SPA routing & headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: Remove default nginx welcome page
RUN rm -f /usr/share/nginx/html/50x.html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

