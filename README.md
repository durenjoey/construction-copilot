# Construction Copilot

A Next.js application for managing construction projects with Firebase integration.

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Firestore enabled

## Environment Setup

1. Clone the repository
2. Run the setup script:
```bash
npm run setup
```

This will:
- Create `.env.local` from the example file
- Install dependencies
- Initialize Firebase project
- Start the development environment

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the following:

```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Firebase Admin
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="your-private-key"
```

## Development

Start the development environment with Firebase emulators:

```bash
npm run dev:emulate
```

This will start:
- Next.js development server at http://localhost:3000
- Firebase Auth emulator at http://localhost:9099
- Firebase Firestore emulator at http://localhost:8080
- Firebase Emulator UI at http://localhost:4000

For development without emulators:

```bash
npm run dev
```

## Security Features

### Content Security Policy

The application implements a strict Content Security Policy (CSP) that:
- Restricts script sources to trusted domains
- Controls resource loading
- Prevents XSS attacks
- Reports violations to monitoring

To modify CSP rules, edit `app/security-headers.ts`.

### Security Headers

Additional security headers include:
- HSTS for enforcing HTTPS
- X-Frame-Options to prevent clickjacking
- X-Content-Type-Options to prevent MIME-type sniffing
- Referrer-Policy for privacy
- Permissions-Policy for feature control

### Authentication

- Google OAuth integration
- JWT-based session management
- CSRF protection
- Rate limiting
- Secure cookie handling

### API Security

- Route protection with middleware
- Request validation
- CORS configuration
- Rate limiting
- Error handling

## Monitoring and Error Handling

### Error Boundaries

React error boundaries catch and handle component errors:
```tsx
// Wrap components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Use HOC
const SafeComponent = withErrorBoundary(YourComponent);

// Async components
<AsyncBoundary>
  <AsyncComponent />
</AsyncBoundary>
```

### Error Monitoring

The monitoring system tracks:
- Client-side errors
- Server-side errors
- API errors
- Performance issues
- Security violations

Configure monitoring in `lib/monitoring.ts`.

### CSP Violation Reporting

CSP violations are:
- Logged to the monitoring system
- Stored in Firestore (production)
- Available for analysis
- Trigger alerts for critical issues

## Firebase Configuration

### Deploy Firebase Rules

```bash
npm run deploy:rules
```

### Deploy Firebase Indexes

```bash
npm run deploy:indexes
```

### Deploy Everything

```bash
npm run deploy:all
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── csp-report/   # CSP violation reporting
│   │   └── ...          # Other API endpoints
│   ├── auth/             # Authentication pages
│   └── dashboard/        # Dashboard pages
├── components/            # React components
│   ├── ui/              # UI components
│   └── error-boundary.tsx # Error handling
├── lib/                   # Utility functions
│   ├── firebase.ts       # Firebase client
│   ├── firebase-admin.ts # Firebase admin
│   ├── auth.ts          # Authentication
│   ├── monitoring.ts    # Error monitoring
│   └── types.ts         # TypeScript types
├── public/               # Static files
└── scripts/              # Development scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

Report security vulnerabilities to [security@example.com](mailto:security@example.com).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
