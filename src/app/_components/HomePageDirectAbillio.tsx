/**
 * Version 2: Tiešs fetch uz Abillio API no servera puses
 * Šis komponents izmanto abillioApiRequest, lai veiktu pieprasījumu tieši uz Abillio API servera pusē.
 * Priekšrocība: nav starpnieka, ātrāks, bet jāuzmanās ar sensitīviem datiem un rate limiting.
 */
import Image from 'next/image';
// import Link from 'next/link';
import { getDictionary } from '../_dictionaries';
import { abillioApiRequest } from '@/lib/abillio';
import HomePageHeader from './HomePageHeader';

type AbillioPagination = {
  page?: number;
  num_pages?: number;
  previous_page?: number | null;
  next_page?: number | null;
  count?: number;
};

type AbillioServiceResponse = {
  result: unknown[];
  pagination?: AbillioPagination;
};

export default async function HomePageDirectAbillio({ lang }: { lang: 'en' | 'lv' }) {
  const dict = getDictionary(lang);
  const data = await abillioApiRequest<AbillioServiceResponse>('services', {}, 'GET', { lang });
  const services = data.result;
  const pagination = data.pagination ?? null;

  const otherLang = lang === 'en' ? 'lv' : 'en';

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <HomePageHeader dict={dict} otherLang={otherLang} lang={lang} activePage="direct-abillio" />

        {/* Info block for usage and description */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold mb-2 ">{dict.directAbillioFetch}</h2>
          <div className="flex flex-col gap-2">
            <p
              className="text-sm/6 font-[family-name:var(--font-geist-mono)]"
              dangerouslySetInnerHTML={{ __html: dict.directAbillioInfo }}
            />
            <p className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
              {dict.requestExampleServer}
            </p>
            <pre className="border border-white/20 p-4 rounded overflow-x-auto text-xs font-[family-name:var(--font-geist-mono)]">{`
import { abillioApiRequest } from '@/lib/abillio';

const data = await abillioApiRequest('services', {}, 'GET', { lang });
const services = data.result;
const pagination = data.pagination;
`}</pre>
            <p className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
              !!! Šis ir <b>servera komponents</b> (nav <code>use client</code>), tāpēc to var
              izmantot tikai servera lapās vai wrapper komponentos.
            </p>
          </div>
        </div>
        <div className="w-full max-w-2xl mt-8">
          <h2 className="text-lg font-bold mb-2 ">{dict.abillioServices}</h2>
          {pagination && (
            <div className="flex gap-2">
              <span>
                Page {pagination.page ?? '-'} of {pagination.num_pages ?? '-'}
              </span>
              <button className="underline" disabled={!pagination?.previous_page}>
                Previous
              </button>
              <button className="underline" disabled={!pagination?.next_page}>
                Next
              </button>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Showing {services.length} of {pagination?.count ?? '-'} results
          </div>
          <pre className="border border-white/5 p-4 rounded overflow-x-auto text-xs font-[family-name:var(--font-geist-mono)]">
            {JSON.stringify(services, null, 2)}
          </pre>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
