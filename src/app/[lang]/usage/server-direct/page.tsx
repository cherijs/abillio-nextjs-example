import { getDictionary } from '../../../_dictionaries';
import HomePageHeader from '../../../_components/Header';
import { JsonViewer } from '@/components/ui/json-tree-viewer';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AbillioService {
  id: number;
  plan_id: number;
  supported_countries: string[];
  name: string;
  dont_support: string | null;
  services: {
    id: number;
    name: string;
    vat: number | null;
    supports_royalties: boolean;
  }[];
}

interface AbillioPagination {
  num_pages: number;
  count: number;
  page: number;
  next_page: number | null;
  previous_page: number | null;
  per_page: number;
}

interface AbillioApiResponse {
  result: AbillioService[];
  pagination?: AbillioPagination;
}

export default async function ServerDirectUsagePage({
  params,
}: {
  params: Promise<{ lang: 'en' | 'lv' }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  const { abillioApiRequest } = await import('@/lib/server/abillio');
  const data = (await abillioApiRequest('services', {}, 'GET', {
    lang,
    country: 'LV',
  })) as AbillioApiResponse;
  const services = data.result;
  const pagination = data.pagination ?? null;

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
          <h2 className="text-lg font-bold mb-2 ">{dict.directAbillioFetch}</h2>
          <div className="flex flex-col gap-2 text-sm/6 font-[family-name:var(--font-geist-mono)]">
            <p dangerouslySetInnerHTML={{ __html: dict.directAbillioInfo }} />
            <p dangerouslySetInnerHTML={{ __html: dict.directAbillioCaveats }} />
            <p>{dict.requestExampleServer}</p>
            <pre>{`import { abillioApiRequest } from '@/lib/abillio';
const data = await abillioApiRequest('services', {}, 'GET', { lang });
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
