'use client';

import Image from 'next/image';
// import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { getDictionary } from '../_dictionaries';
import { useState } from 'react';
import HomePageHeader from './HomePageHeader';

type AbillioPagination = {
  page?: number;
  num_pages?: number;
  previous_page?: number | null;
  next_page?: number | null;
  count?: number;
};

export default function HomePage({ lang }: { lang: 'en' | 'lv' }) {
  const dict = getDictionary(lang);

  const [services, setServices] = useState<unknown[]>([]);
  const [pagination, setPagination] = useState<AbillioPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getServices = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/abillio/services?lang=${lang}&p=${page}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setServices(data.result);
        setPagination(data.pagination);
        setLoading(false);
        return data;
      } catch (error) {
        setLoading(false);
        setServices([]);
        setPagination(null);
        console.error('Neizdevās ielādēt datus:', error);
        setError(error instanceof Error ? error.message : String(error));
        return { error: true, message: error instanceof Error ? error.message : String(error) };
      }
    },
    [lang],
  );

  useEffect(() => {
    setLoading(true);
    getServices(page);
  }, [lang, page, getServices]);

  const otherLang = lang === 'en' ? 'lv' : 'en';

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <HomePageHeader dict={dict} otherLang={otherLang} lang={lang} activePage="client" />

        <div className="w-full max-w-2xl mt-8">
          <h2 className="text-lg font-bold mb-2 ">{dict.abillioServices}</h2>
          {pagination && (
            <div className="flex gap-2">
              <span>
                Page {pagination ? pagination.page : '-'} of{' '}
                {pagination ? pagination.num_pages : '-'}
              </span>
              <button
                className="underline"
                disabled={!pagination?.previous_page}
                onClick={() =>
                  typeof pagination?.previous_page === 'number' && setPage(pagination.previous_page)
                }
              >
                Previous
              </button>
              <button
                className="underline"
                disabled={!pagination?.next_page}
                onClick={() =>
                  typeof pagination?.next_page === 'number' && setPage(pagination.next_page)
                }
              >
                Next
              </button>
            </div>
          )}

          {loading || !services ? (
            ''
          ) : (
            <div className="mt-2 text-xs text-gray-500">
              Showing {services.length} of {pagination ? pagination.count : '-'} results
            </div>
          )}
          <pre className="border border-white/5 p-4 rounded overflow-x-auto text-xs font-[family-name:var(--font-geist-mono)]">
            {loading ? 'Loading...' : services ? JSON.stringify(services, null, 2) : 'No services'}
          </pre>
        </div>

        {error && <div className="text-red-500 mt-2">Kļūda ielādējot datus: {error}</div>}
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
