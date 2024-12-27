import { NextRequest, NextResponse } from 'next/server'
import { handleCspViolation } from '@/app/security-headers'

export async function POST(req: NextRequest) {
  try {
    // Parse CSP violation report
    const report = await req.json()

    // Log the violation
    await handleCspViolation(report['csp-report'] || report)

    // Store in database or send to monitoring service if needed
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoring(report)
      
      // Example: Store in Firestore
      /*
      const { adminDb } = await import('@/lib/firebase-admin')
      await adminDb.collection('csp-violations').add({
        ...report,
        timestamp: new Date().toISOString()
      })
      */
    }

    return NextResponse.json(
      { success: true },
      { status: 204 } // No content needed for CSP reports
    )
  } catch (error) {
    console.error('Error handling CSP violation:', error)
    
    // Don't expose error details in response
    return NextResponse.json(
      { success: false },
      { status: 500 }
    )
  }
}

// Increase body size limit for CSP reports
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb'
    }
  }
}

// Helper function to sanitize report data
function sanitizeReport(report: any) {
  // Remove potentially sensitive information
  const sanitized = { ...report }
  delete sanitized['source-file']
  delete sanitized['script-sample']
  return sanitized
}

// Helper function to validate report format
function isValidReport(report: any): boolean {
  const requiredFields = ['blocked-uri', 'violated-directive']
  return requiredFields.every(field => 
    Object.prototype.hasOwnProperty.call(report, field)
  )
}

// Helper function to classify violation severity
function getViolationSeverity(report: any): 'low' | 'medium' | 'high' {
  const directive = report['violated-directive']
  
  if (directive.startsWith('script-src')) {
    return 'high'
  }
  
  if (directive.startsWith('connect-src')) {
    return 'medium'
  }
  
  return 'low'
}

// Helper function to check if violation should be ignored
function shouldIgnoreViolation(report: any): boolean {
  // Ignore violations from browser extensions
  if (report['blocked-uri'].startsWith('chrome-extension://')) {
    return true
  }
  
  // Ignore self-violations during development
  if (process.env.NODE_ENV === 'development' && 
      report['document-uri'].includes('localhost')) {
    return true
  }
  
  return false
}

// Helper function to format violation for monitoring
function formatViolationForMonitoring(report: any) {
  return {
    type: 'csp_violation',
    severity: getViolationSeverity(report),
    directive: report['violated-directive'],
    blockedUri: report['blocked-uri'],
    documentUri: report['document-uri'],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }
}

// Example monitoring service integration
async function sendToMonitoring(report: any) {
  if (!isValidReport(report) || shouldIgnoreViolation(report)) {
    return
  }

  const formattedReport = formatViolationForMonitoring(report)
  
  // Send to your monitoring service
  // await fetch('your-monitoring-endpoint', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(formattedReport)
  // })
}
