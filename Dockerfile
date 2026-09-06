# ============================================================
# COOP HUB Production Backend Container
# High-performance, secure, stateless Express API instance
# ============================================================

FROM node:22-bookworm-slim AS production

# Security & Runtime Environment Configuration
ENV NODE_ENV=production \
    PORT=5000 \
    INSTANCE_ID=api-standalone

# Install minimal system essentials for networking & health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set non-privileged application directory
WORKDIR /app

# Copy package manifests for deterministic Docker layer caching
COPY package.json package-lock.json ./

# Install production dependencies only without dev overhead
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

# Copy Express backend source code and static assets
COPY server/ ./server/
COPY public/ ./public/

# Enforce non-root execution for container security
RUN chown -R node:node /app
USER node

# Expose backend API port
EXPOSE 5000

# Native Node.js health check against /api/health
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run the existing Express production server
CMD ["node", "server/server.js"]
