#!/bin/bash

echo "🚀 Complete Kitchen Management Setup"
echo "===================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo ""
    echo "📝 Please create a .env.local file with your database credentials:"
    echo "cp .env.local.example .env.local"
    echo ""
    echo "Then edit .env.local with your actual Neon database URL and secrets."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install dotenv

echo "🔧 Loading environment and generating Prisma client..."
npm run db:generate

echo "📊 Pushing schema to database..."
npm run db:push

echo "🌱 Seeding database with sample data..."
npm run db:seed

echo ""
echo "✅ Setup complete! 🎉"
echo ""
echo "🚀 Start the development server:"
echo "npm run dev"
echo ""
echo "📧 Login credentials:"
echo "Email: admin@kitchen.com"
echo "Password: admin123"
echo ""
echo "🔧 Useful commands:"
echo "npm run db:studio  - Open Prisma Studio"
echo "npm run db:reset   - Reset database"
