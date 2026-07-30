FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY api/package.json api/
COPY migrations/package.json migrations/
COPY web/package.json web/
RUN npm ci -w @webgame-cloud/api --include-workspace-root=false
COPY api/tsconfig.json api/
COPY api/src api/src
RUN npm run build -w @webgame-cloud/api

FROM alpine:3.21 AS goose
ARG TARGETARCH
ARG GOOSE_VERSION=v3.27.2
RUN case "$TARGETARCH" in \
        amd64) GOOSE_ARCH=x86_64 ;; \
        *) GOOSE_ARCH="$TARGETARCH" ;; \
    esac \
    && wget -q -O /goose "https://github.com/pressly/goose/releases/download/${GOOSE_VERSION}/goose_linux_${GOOSE_ARCH}" \
    && chmod +x /goose \
    && /goose --version

FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=goose /goose /usr/local/bin/goose
COPY --from=build /app/api/dist ./dist
COPY migrations/sql ./migrations
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
