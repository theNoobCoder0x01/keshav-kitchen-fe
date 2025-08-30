#!/bin/bash
set -e

echo "🚀 Running db setup..."
if [ "$NODE_ENV" = "production" ]; then
  npm run setup:prod
else
  npm run setup:dev
fi

echo "✅ Setup done. Starting app..."
exec "$@"