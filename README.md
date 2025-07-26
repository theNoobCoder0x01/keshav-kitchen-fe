This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Security Features

This project uses the Web Crypto API for secure password hashing, making it compatible with Next.js Edge Runtime. The implementation includes:

- **PBKDF2 with SHA-256**: Industry-standard password hashing
- **100,000 iterations**: High iteration count for security
- **32-byte random salt**: Cryptographically secure salt generation
- **Constant-time comparison**: Protection against timing attacks
- **Edge Runtime compatible**: No Node.js dependencies for crypto operations

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Password Security

### Web Crypto API Implementation

The project uses a custom Web Crypto API implementation for password hashing instead of bcryptjs to ensure Edge Runtime compatibility. Key features:

- **Algorithm**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (configurable)
- **Salt**: 32 bytes of cryptographically secure random data
- **Output**: Base64-encoded salt and hash separated by a dot

### Migration from bcryptjs

If you're migrating from bcryptjs, the system automatically detects legacy hashes and migrates them during user login. This ensures a smooth transition without requiring password resets.

### Usage Example

```typescript
import { hashPassword, verifyPassword } from '@/lib/crypto-utils';

// Hash a password
const hashedPassword = await hashPassword('userPassword123');

// Verify a password
const isValid = await verifyPassword('userPassword123', hashedPassword);
```

### Security Considerations

- Passwords are hashed with a high iteration count (100,000) to resist brute-force attacks
- Each password uses a unique random salt to prevent rainbow table attacks
- Constant-time comparison prevents timing attacks during verification
- The implementation is compatible with Next.js Edge Runtime for better performance