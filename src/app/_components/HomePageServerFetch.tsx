/**
 * Version 1: Server-side fetch uz savu Next.js API (proxy uz Abillio)
 * Šis komponents veic fetch uz /api/abillio/services servera pusē, izmantojot await.
 * Priekšrocība: vari izmantot Next.js API autentifikāciju, rate limiting u.c.
 */

import { AlertCircle } from 'lucide-react';
import { getDictionary } from '../_dictionaries';
import HomePageHeader from './Header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { JsonViewer } from '@/components/ui/json-tree-viewer';

type AbillioPagination = {
  page?: number;
  num_pages?: number;
  previous_page?: number | null;
  next_page?: number | null;
  count?: number;
};

export default async function HomePageServerFetch({ lang }: { lang: 'en' | 'lv' }) {
  const dict = getDictionary(lang);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/abillio/services?lang=${lang}`, { cache: 'no-store' });
  const data = await res.json();
  const services = data.result as unknown[];
  const pagination = data.pagination as AbillioPagination | null;

  const otherLang = lang === 'en' ? 'lv' : 'en';

  return (
    <div className="px-8 py-20 font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <main className="flex flex-col gap-[32px] items-center sm:items-start w-full max-w-2xl flex-grow">
        <HomePageHeader dict={dict} otherLang={otherLang} lang={lang} activePage="server-fetch" />

        <div className="flex flex-col gap-4">
          <Badge variant="destructive">{dict.serverComponent}</Badge>
          <h2 className="text-lg font-bold mb-2 ">{dict.serverSideFetch}</h2>
          <div className="flex flex-col gap-2">
            <p
              className="text-sm/6 font-[family-name:var(--font-geist-mono)]"
              dangerouslySetInnerHTML={{ __html: dict.serverFetchInfo }}
            />
            <p className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
              {dict.requestExampleServer}
            </p>
            <pre>{`const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const res = await fetch(
  \`${baseUrl}/api/abillio/services?lang=${lang}\`,
  { cache: 'no-store' }
);
const data = await res.json();
const services = data.result;
const pagination = data.pagination;
`}</pre>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{dict.serverComponent}</AlertTitle>
              <AlertDescription>{dict.serverComponentAlert}</AlertDescription>
            </Alert>
          </div>
        </div>
        <div className="w-full max-w-2xl mt-8">
          <h2 className="text-lg font-bold mb-2 ">{dict.abillioServices}</h2>
          <div className="mt-2 text-xs text-gray-500">
            {dict.showingResults
              .replace('{count}', String(services.length))
              .replace('{total}', pagination?.count ? String(pagination.count) : '-')}
          </div>
          {/* <pre className="max-h-[400px] overflow-y-auto">{JSON.stringify(services, null, 2)}</pre> */}
          {services ? <JsonViewer data={services} /> : dict.loading}
        </div>
      </main>
    </div>
  );
}
