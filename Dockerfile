# --- Build stage -----------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /build

# VITE_API_BASE_URL is a Vite build-time env var — it gets inlined into
# the compiled JS bundle, so it must be supplied as a build ARG (not a
# runtime env var like the nginx proxy target below). Defaults to a
# relative path so the SAME built image works unchanged behind local
# docker-compose (nginx proxies it to the backend container) and behind
# the AWS ALB (which routes /api/* straight to the backend target group
# at the same host), without needing environment-specific rebuilds.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy lockfile first so the npm ci layer is cached across rebuilds that
# only touch source, not dependencies.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage -----------------------------------------------------
# nginx-unprivileged: the official nginx team's image pre-configured to
# listen on port 8080 and run entirely as a non-root user (no root master
# process at all), rather than patching the stock nginx:alpine image
# ourselves to drop privileges.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Runtime (not build-time) proxy target for local docker-compose. Unused
# in AWS — see nginx.conf.template.
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q -O- http://127.0.0.1:8080/healthz || exit 1
