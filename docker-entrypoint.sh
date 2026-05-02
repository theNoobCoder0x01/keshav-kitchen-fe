#!/bin/bash
set -e

echo "Running db setup..."
npm run setup

echo "Setup done. Starting app..."
exec "$@"
