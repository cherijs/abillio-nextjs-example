/**
 * Version 1: Server-side fetch uz savu Next.js API (proxy uz Abillio)
 * Šis komponents veic fetch uz /api/abillio/services servera pusē, izmantojot await.
 * Priekšrocība: vari izmantot Next.js API autentifikāciju, rate limiting u.c.
 */
import Image from 'next/image';
import Link from 'next/link';
import { getDictionary } from '../_dictionaries';
import HomePageHeader from './HomePageHeader';

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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <HomePageHeader dict={dict} otherLang={otherLang} lang={lang} activePage="server-fetch" />

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold mb-2 ">{dict.serverSideFetch}</h2>
          <div className="flex flex-col gap-2">
            <p
              className="text-sm/6 font-[family-name:var(--font-geist-mono)]"
              dangerouslySetInnerHTML={{ __html: dict.serverFetchInfo }}
            />
            <p className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
              {dict.requestExampleServer}
            </p>
            <pre className="border border-white/20 p-4 rounded overflow-x-auto text-xs font-[family-name:var(--font-geist-mono)]">{`
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL && \`https://${process.env.VERCEL_URL}\`) ||
  'http://localhost:3000';
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
      </main>
    </div>
  );
}
