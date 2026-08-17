# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines import.meta.env.VITE_* at build time, not runtime — these
# have to be build args (passed via docker-compose.deploy.yml's
# frontend.build.args), not container env vars set later.
ARG VITE_API_BASE_URL
ARG VITE_DEMO_TENANT_ID
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_DEMO_TENANT_ID=${VITE_DEMO_TENANT_ID}

RUN npm run build

# ── Serve stage ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1