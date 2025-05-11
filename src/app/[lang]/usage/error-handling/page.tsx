/**
 * Error Handling Demo (Task 6)
 * Demonstrates:
 * - Handling API errors (404, 500)
 * - Handling params Promise errors (Next.js 15+)
 * - User-friendly error messages
 * - Retry logic
 * - Reusable ErrorAlert component
 * - Best practices for error handling in Abillio API integration
 */

import { ErrorHandlingDemoClient } from '@/app/_components/ErrorHandlingDemoClient';
import { getDictionary } from '@/app/_dictionaries';

export default async function ErrorHandlingDemo({
  params,
}: {
  params: Promise<{ lang: 'en' | 'lv' }>;
}) {
  let lang: 'en' | 'lv' = 'en';
  try {
    const resolved = await params;
    lang = resolved.lang === 'en' ? 'en' : 'lv';
  } catch {
    const dict = getDictionary('en');
    return (
      <ErrorHandlingDemoClient
        error={new Error('Failed to resolve route params (Next.js 15+).')}
        dict={dict}
        lang={lang}
      />
    );
  }
  const dict = getDictionary(lang);
  return <ErrorHandlingDemoClient lang={lang} dict={dict} />;
}
