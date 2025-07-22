# Install all dependencies
npm install

# Set up the database
npx prisma generate
npx prisma db push

# Seed the database with sample data
npx prisma db seed

# Start the development server
npm run dev
