import { getDictionary } from '../../../_dictionaries';
import HomePageHeader from '../../../_components/Header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { JsonViewer } from '@/components/ui/json-tree-viewer';

export default async function ServerProxyUsagePage({
  params,
}: {
  params: Promise<{ lang: 'en' | 'lv' }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/abillio/services?lang=${lang}&country=LV`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const services = data.result;
  const pagination = data.pagination;

  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <main className="flex flex-col gap-[32px] items-center sm:items-start w-full max-w-2xl flex-grow">
        <HomePageHeader dict={dict} />
        <div className="flex flex-col gap-4">
          <Badge variant="destructive">{dict.serverComponent}</Badge>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dict.serverComponentAlert}</AlertDescription>
          </Alert>
          <h2 className="text-lg font-bold mb-2 ">{dict.serverSideFetch}</h2>
          <div className="flex flex-col gap-4 text-sm/6 font-[family-name:var(--font-geist-mono)]">
            <p dangerouslySetInnerHTML={{ __html: dict.serverFetchInfo }} />
            <p dangerouslySetInnerHTML={{ __html: dict.serverFetchCaveats }} />
            <p>{dict.requestExampleServer}</p>
            <pre>{`const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const res = await fetch(
  \`${baseUrl}/api/abillio/services?lang=${lang}\`,
  { cache: 'no-store' }
);
const data = await res.json();
const services = data.result;
const pagination = data.pagination;
`}</pre>
          </div>
        </div>
        <div className="w-full">
          <h2 className="text-lg font-bold mb-2 ">{dict.abillioServices}</h2>
          <div className="mt-2 text-xs text-gray-500">
            {dict.showingResults
              .replace('{count}', String(services.length))
              .replace('{total}', pagination?.count ? String(pagination.count) : '-')}
          </div>
          {services ? (
            <JsonViewer data={services} className="rounded-md p-4 my-4 border" />
          ) : (
            dict.loading
          )}
        </div>
      </main>
    </div>
  );
}
