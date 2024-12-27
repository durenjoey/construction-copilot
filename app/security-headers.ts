const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.googleusercontent.com https://www.gstatic.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  frame-src 'self' https://accounts.google.com https://*.firebaseapp.com;
  connect-src 'self' 
    https://*.googleapis.com 
    https://*.firebaseio.com 
    https://*.cloudfunctions.net
    https://*.firebase.googleapis.com
    wss://*.firebaseio.com
    https://accounts.google.com;
  media-src 'none';
  manifest-src 'self';
  report-uri /api/csp-report;
  report-to csp-endpoint;
`.replace(/\s{2,}/g, ' ').trim();

const ReportToHeader = {
  group: 'csp-endpoint',
  max_age: 10886400,
  endpoints: [
    { url: '/api/csp-report' }
  ]
};

export const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Reporting-Endpoints
  {
    key: 'Reporting-Endpoints',
    value: 'csp-endpoint="/api/csp-report"',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Report-To
  {
    key: 'Report-To',
    value: JSON.stringify(ReportToHeader),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

// Middleware to apply security headers
export function applySecurityHeaders(headers: Headers) {
  securityHeaders.forEach(({ key, value }) => {
    headers.set(key, value);
  });
}

// Helper to validate external URLs
export function isValidExternalUrl(url: string): boolean {
  try {
    const validDomains = [
      'googleapis.com',
      'firebaseio.com',
      'cloudfunctions.net',
      'firebase.googleapis.com',
      'googleusercontent.com',
      'gstatic.com',
      'google.com',
    ];

    const urlObj = new URL(url);
    return validDomains.some(domain => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

// Helper to create nonce for inline scripts
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

// Helper to validate Content Security Policy
export function validateCsp(csp: string): boolean {
  const directives = csp.split(';').map(d => d.trim());
  const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'connect-src',
  ];

  return requiredDirectives.every(required =>
    directives.some(d => d.startsWith(required))
  );
}

// Helper to create Report-Only CSP for testing
export function createReportOnlyCsp(csp: string): string {
  return csp.replace('Content-Security-Policy', 'Content-Security-Policy-Report-Only');
}

// Helper to create CSP violation report endpoint
export async function handleCspViolation(report: {
  'blocked-uri'?: string;
  'document-uri'?: string;
  'violated-directive'?: string;
  [key: string]: any;
}) {
  console.error('CSP Violation:', {
    'blocked-uri': report['blocked-uri'],
    'document-uri': report['document-uri'],
    'violated-directive': report['violated-directive'],
  });
}

// Helper to get environment-specific CSP
export function getEnvironmentCsp(): string {
  if (process.env.NODE_ENV === 'development') {
    // Allow localhost in development
    return ContentSecurityPolicy.replace(
      "connect-src 'self'",
      "connect-src 'self' http://localhost:* ws://localhost:*"
    );
  }
  return ContentSecurityPolicy;
}
