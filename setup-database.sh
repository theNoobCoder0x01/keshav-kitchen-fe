#!/bin/bash

echo "🚀 Setting up Kitchen Management Database..."

# Install additional dependencies
echo "📦 Installing dependencies..."
npm install esbuild-register

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "📊 Pushing schema to database..."
npx prisma db push

# Seed the database
echo "🌱 Seeding database..."
node prisma/seed.js

echo "✅ Database setup complete!"
echo ""
echo "🎉 You can now start the development server:"
echo "npm run dev"
echo ""
echo "📧 Login credentials:"
echo "Email: admin@kitchen.com"
echo "Password: admin123"
