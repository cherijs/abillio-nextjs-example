'use client';

import { useEffect, useCallback } from 'react';
import { getDictionary } from '../_dictionaries';
import { useState } from 'react';
import HomePageHeader from './Header';

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
    <div className="px-8 py-20 font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <main className="flex flex-col gap-[32px] items-center sm:items-start w-full max-w-2xl flex-grow">
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
          <pre>
            <code>
              {' '}
              {loading
                ? 'Loading...'
                : services
                  ? JSON.stringify(services, null, 2)
                  : 'No services'}
            </code>
          </pre>
        </div>

        {error && <div className="text-red-500 mt-2">Kļūda ielādējot datus: {error}</div>}
      </main>
    </div>
  );
}
