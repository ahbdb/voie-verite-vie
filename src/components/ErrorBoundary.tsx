import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🔴 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <h1 className="text-lg font-bold text-destructive">Une erreur s'est produite</h1>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              L'application a rencontré un problème inattendu. Vos données ne sont pas perdues.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-muted p-3 rounded mb-4 text-xs font-mono text-muted-foreground overflow-auto max-h-40">
                {this.state.error.message}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={this.resetError}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex-1"
              >
                Accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
