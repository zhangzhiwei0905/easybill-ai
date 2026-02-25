FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL deps (including devDependencies needed for nest build)
RUN npm ci --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the NestJS application
RUN npx nest build

# ── Production image ──────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install production deps only
RUN npm ci --ignore-scripts --omit=dev

# Generate Prisma client in prod image
RUN npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
