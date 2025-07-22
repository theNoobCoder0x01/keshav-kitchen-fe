# Database Setup Guide

## Prerequisites

1. **Neon Database Account**: Sign up at [neon.tech](https://neon.tech)
2. **Node.js**: Make sure you have Node.js 18+ installed

## Step 1: Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Create a new project
3. Copy your database connection string
4. It should look like: `postgresql://username:password@host/database?sslmode=require`

## Step 2: Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add your database URL:

\`\`\`env
DATABASE_URL="your-neon-database-connection-string-here"
NEXTAUTH_SECRET="your-super-secret-key-here-make-it-long-and-random"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## Step 3: Setup Database

Run the setup script:

\`\`\`bash
chmod +x setup-database.sh
./setup-database.sh
\`\`\`

Or run commands manually:

\`\`\`bash
# Install dependencies
npm install esbuild-register

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample data
node prisma/seed.js
\`\`\`

## Step 4: Start Development Server

\`\`\`bash
npm run dev
\`\`\`

## Login Credentials

- **Email**: admin@kitchen.com
- **Password**: admin123

## Troubleshooting

### Error: Environment variable not found: DATABASE_URL

Make sure your `.env.local` file is in the project root and contains the correct DATABASE_URL.

### Connection Issues

1. Check if your Neon database is active
2. Verify the connection string is correct
3. Make sure your IP is whitelisted (Neon usually allows all IPs by default)

### Seed Script Issues

If the seed script fails, you can run it manually:

\`\`\`bash
node prisma/seed.js
\`\`\`

## Database Schema

The application uses the following main tables:

- **Users**: Authentication and user management
- **Kitchens**: Different kitchen locations
- **Recipes**: Recipe definitions with ingredients
- **DailyMenus**: Daily menu planning
- **DailyReports**: Reporting and analytics

## Next Steps

Once the database is set up, you can:

1. Access the application at `http://localhost:3000`
2. Login with the admin credentials
3. Start adding recipes and planning menus
4. View the Prisma Studio at `npx prisma studio` for database management
