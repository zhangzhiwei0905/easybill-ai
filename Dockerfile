FROM node:22-alpine

WORKDIR /app

# Copy dependency files first (layer cache optimization)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install ALL dependencies (devDeps needed for nest build)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source (node_modules excluded via .dockerignore)
COPY backend/ .

# Build TypeScript → dist/
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main"]
