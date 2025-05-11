'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorAlert({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-semibold">{error.name}</div>
        <div>{error.message}</div>
        {onRetry && (
          <button
            className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs font-medium"
            onClick={onRetry}
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}
