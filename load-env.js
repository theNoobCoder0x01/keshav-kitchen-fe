// Load environment variables from .env.local
const { config } = require("dotenv");
const path = require("path");

// Load .env.local first, then .env
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "NEXTAUTH_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.log(
      "\n📝 Please check your .env.local file and ensure it contains:",
    );
    console.log('DATABASE_URL="your-neon-database-connection-string"');
    console.log('NEXTAUTH_SECRET="your-secret-key"');
    process.exit(1);
  }
}

console.log("✅ Environment variables loaded successfully");

// Export the environment variables so they can be used by child processes
module.exports = process.env;
