#!/bin/bash

echo "🚀 Kitchen Management Setup with Environment Check"
echo "=================================================="

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

# Check if DATABASE_URL is set in .env.local
if ! grep -q "DATABASE_URL=" .env.local; then
    echo "❌ DATABASE_URL not found in .env.local!"
    echo ""
    echo "📝 Please add your DATABASE_URL to .env.local:"
    echo 'DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"'
    exit 1
fi

# Check if NEXTAUTH_SECRET is set in .env.local
if ! grep -q "NEXTAUTH_SECRET=" .env.local; then
    echo "❌ NEXTAUTH_SECRET not found in .env.local!"
    echo ""
    echo "📝 Please add your NEXTAUTH_SECRET to .env.local:"
    echo 'NEXTAUTH_SECRET="your-long-random-secret-key"'
    exit 1
fi

echo "✅ Environment file validation passed"
echo ""

echo "📦 Installing dependencies..."
npm install dotenv-cli

echo "🔧 Generating Prisma client..."
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
