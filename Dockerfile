# syntax=docker/dockerfile:1.7

FROM node:20.19.2-alpine AS base
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
COPY --chmod=644 package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG PUBLIC_SITE_URL=https://la-ragazza-web.vercel.app
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
COPY --chmod=755 --from=deps /app/node_modules ./node_modules
COPY --chmod=644 . .
RUN pnpm build

FROM nginx:1.27-alpine AS runtime
COPY --chmod=644 docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

LABEL org.opencontainers.image.title="la-ragazza-web"
LABEL org.opencontainers.image.description="La Ragazza restaurant website"
LABEL org.opencontainers.image.source="https://github.com/juanglc/la-ragazza-web"
