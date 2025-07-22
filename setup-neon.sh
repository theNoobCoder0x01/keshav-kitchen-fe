#!/bin/bash

echo "🚀 Kitchen Management Setup with Neon Database"
echo "=============================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set!"
    echo ""
    echo "📝 Please set your DATABASE_URL environment variable:"
    echo "export DATABASE_URL='postgresql://username:password@host/database?sslmode=require'"
    echo ""
    echo "Or create a .env.local file with:"
    echo "DATABASE_URL='postgresql://username:password@host/database?sslmode=require'"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

echo "📦 Installing dependencies..."
npm install

echo "🔌 Testing database connection..."
npm run db:test

echo "🔧 Setting up database tables and seed data..."
npm run db:setup

echo ""
echo "✅ Setup complete! 🎉"
echo ""
echo "🚀 Start the development server:"
echo "npm run dev"
echo ""
echo "📧 Login credentials:"
echo "Email: admin@kitchen.com"
echo "Password: admin123"
