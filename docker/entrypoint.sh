#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/apps/server
pnpm exec prisma migrate deploy

echo "Starting server..."
exec pnpm start
