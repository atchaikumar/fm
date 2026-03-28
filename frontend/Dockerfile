# ── Stage 1: Build Angular app ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ── Stage 2: Serve via nginx ─────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist/ai-fm-radio/browser /usr/share/nginx/html

# SPA routing: all unknown paths → index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
