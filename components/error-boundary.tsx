'use client';

import React from 'react';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReport = async () => {
    if (!this.state.error) return;

    try {
      // Send error to API endpoint
      const response = await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: this.state.error.message,
          stack: this.state.error.stack,
          type: 'client',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to report error');
      }

      // Show feedback to user
      alert('Error has been reported. Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-medium">Something went wrong</h3>
                <p className="text-sm text-muted-foreground">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={this.handleRetry}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={this.handleReport}
              >
                Report Issue
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto">
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Component for wrapping async components
export function AsyncBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
