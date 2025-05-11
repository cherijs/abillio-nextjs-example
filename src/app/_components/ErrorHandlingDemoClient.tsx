'use client';

import React, { useState } from 'react';
import { ErrorAlert } from './ErrorAlert';
import { Badge } from '@/components/ui/badge';

type AbillioDictionary = {
  abillioServices: string;
  [key: string]: string;
};

export function ErrorHandlingDemoClient({
  lang,
  error,
  dict,
}: {
  lang?: 'en' | 'lv';
  error?: Error;
  dict: AbillioDictionary;
}) {
  const [apiError, setApiError] = useState<Error | null>(error ?? null);
  const [data, setData] = useState<unknown>(null);

  // Only fetch if no error and lang is present
  const fetchApi = async () => {
    setApiError(null);
    try {
      const res = await fetch('/api/abillio/nonexistent-endpoint', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      setData(await res.json());
    } catch (e) {
      if (e instanceof Error) setApiError(e);
      else setApiError(new Error('Unknown error'));
    }
  };

  // Fetch on mount if no error and lang is present
  React.useEffect(() => {
    if (!error && lang) fetchApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <main className="flex flex-col gap-8 items-center sm:items-start w-full max-w-2xl flex-grow">
        <h1 className="text-2xl font-bold mb-2">
          {dict?.abillioServices ?? 'Abillio Services'} – Error Handling Demo
        </h1>
        <Badge variant="destructive">Error Handling Example</Badge>
        <div className="flex flex-col gap-4 w-full">
          <p className="text-sm text-gray-600">
            This page demonstrates error handling for API errors (404, 500) and params Promise
            errors in Next.js 15+ App Router. See code comments for best practices.
          </p>
          {apiError ? (
            <ErrorAlert error={apiError} onRetry={fetchApi} />
          ) : (
            <pre className="bg-muted p-4 rounded text-xs">{JSON.stringify(data, null, 2)}</pre>
          )}
        </div>
      </main>
    </div>
  );
}
