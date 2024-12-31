interface ErrorDetails {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
  type: 'security' | 'application' | 'api' | 'database' | 'auth' | 'client';
  timestamp: string;
  environment: string;
}

interface MonitoringConfig {
  enabled: boolean;
  logToConsole: boolean;
  logToDatabase: boolean;
  logToFile: boolean;
  minSeverity: 'low' | 'medium' | 'high';
}

const config: MonitoringConfig = {
  enabled: process.env.NODE_ENV === 'production',
  logToConsole: process.env.NODE_ENV === 'development',
  logToDatabase: process.env.NODE_ENV === 'production',
  logToFile: false,
  minSeverity: process.env.NODE_ENV === 'production' ? 'medium' : 'low',
};

export async function logError(error: Error | unknown, context: Record<string, any> = {}) {
  if (!config.enabled && process.env.NODE_ENV === 'production') {
    return;
  }

  const errorDetails: ErrorDetails = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    severity: getSeverity(error),
    type: getErrorType(error, context),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Console logging
  if (config.logToConsole) {
    console.error('Error:', {
      ...errorDetails,
      context: JSON.stringify(context, null, 2),
    });
  }

  // Only attempt database logging on the server side
  if (config.logToDatabase && typeof window === 'undefined') {
    try {
      const { adminDb } = await import('./firebase-admin');
      await adminDb.collection('errors').add(errorDetails);
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  }

  // Send to external monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    await sendToMonitoring(errorDetails);
  }
}

function getSeverity(error: Error | unknown): ErrorDetails['severity'] {
  if (error instanceof Error) {
    // Security-related errors are high severity
    if (
      error.message.includes('security') ||
      error.message.includes('authentication') ||
      error.message.includes('authorization')
    ) {
      return 'high';
    }

    // Database errors are medium severity
    if (
      error.message.includes('database') ||
      error.message.includes('firestore')
    ) {
      return 'medium';
    }
  }

  return 'low';
}

function getErrorType(error: Error | unknown, context: Record<string, any>): ErrorDetails['type'] {
  if (context.type) {
    return context.type;
  }

  if (error instanceof Error) {
    if (error.message.includes('security') || error.message.includes('auth')) {
      return 'security';
    }
    if (error.message.includes('database') || error.message.includes('firestore')) {
      return 'database';
    }
    if (error.message.includes('api')) {
      return 'api';
    }
  }

  return typeof window === 'undefined' ? 'application' : 'client';
}

async function sendToMonitoring(errorDetails: ErrorDetails) {
  // For client-side errors, send to error reporting API endpoint
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
    return;
  }

  // For server-side errors, log to database directly
  if (config.logToDatabase) {
    try {
      const { adminDb } = await import('./firebase-admin');
      await adminDb.collection('errors').add(errorDetails);
    } catch (error) {
      console.error('Failed to log server error:', error);
    }
  }
}

// Rate limiting for error logging
const errorCounts = new Map<string, number>();
const ERROR_THRESHOLD = 10;
const WINDOW_MS = 60000; // 1 minute

export function shouldLogError(errorKey: string): boolean {
  const now = Date.now();
  const count = errorCounts.get(errorKey) || 0;

  if (count >= ERROR_THRESHOLD) {
    return false;
  }

  errorCounts.set(errorKey, count + 1);

  // Reset count after window
  setTimeout(() => {
    errorCounts.delete(errorKey);
  }, WINDOW_MS);

  return true;
}

// Helper to create error context
export function createErrorContext(
  component: string,
  action: string,
  additionalContext: Record<string, any> = {}
): Record<string, any> {
  return {
    component,
    action,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

// Helper to sanitize error data
export function sanitizeErrorData(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Export monitoring configuration
export const monitoring = {
  config,
  logError,
  shouldLogError,
  createErrorContext,
  sanitizeErrorData,
};
