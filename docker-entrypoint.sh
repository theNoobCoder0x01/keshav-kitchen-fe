#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Migrations applied. Starting app..."
exec "$@"
