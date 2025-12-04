#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "Starting server..."
cd /app/apps/server
exec yarn start
