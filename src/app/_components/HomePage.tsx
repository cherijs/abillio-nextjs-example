'use client';

import { useEffect, useCallback } from 'react';
import { getDictionary } from '../_dictionaries';
import { useState } from 'react';
import HomePageHeader from './Header';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { buttonVariants } from '@/components/ui/button';
import { JsonViewer } from '@/components/ui/json-tree-viewer';
import { Badge } from '@/components/ui/badge';

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

        {/* Info block for usage and description */}
        <div className="flex flex-col gap-4">
          <Badge variant="secondary">Client component</Badge>
          <h2 className="text-lg font-bold mb-2 ">{dict.clientSideFetch}</h2>
          <div className="flex flex-col gap-2">
            <p
              className="text-sm/6 font-[family-name:var(--font-geist-mono)]"
              dangerouslySetInnerHTML={{ __html: dict.clientInfo }}
            />
            <p className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
              {dict.requestExampleClient}
            </p>
            <pre>{`useEffect(() => {
  fetch('/api/abillio/services?lang=' + lang)
    .then(res => res.json())
    .then(data => {
      setServices(data.result);
      setPagination(data.pagination);
    });
}, [lang]);
`}</pre>
            <p
              className="text-sm/6 font-[family-name:var(--font-geist-mono)]"
              dangerouslySetInnerHTML={{ __html: dict.clientCaveats }}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-500 mt-2">{dict.errorLoadingData.replace('{error}', error)}</div>
        )}

        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-bold mb-2 ">{dict.abillioServices}</h2>
          <div className="flex flex-col items-start">
            {pagination && (
              <Pagination className="mx-auto flex w-full justify-start">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      aria-disabled={!pagination.previous_page}
                      tabIndex={pagination.previous_page ? 0 : -1}
                      onClick={
                        pagination.previous_page
                          ? (e) => {
                              e.preventDefault();
                              setPage(pagination.previous_page as number);
                            }
                          : undefined
                      }
                      href="#"
                      style={
                        !pagination.previous_page
                          ? { pointerEvents: 'none', opacity: 0.5 }
                          : undefined
                      }
                      className={buttonVariants({
                        variant: !pagination.previous_page ? 'ghost' : 'ghost',
                        size: 'icon',
                      })}
                    />
                  </PaginationItem>
                  {Array.from({ length: pagination.num_pages ?? 1 }, (_, i) => {
                    const pageNum = i + 1;
                    // Show first, last, current, and neighbors; ellipsis for gaps
                    const isActive = pageNum === pagination.page;
                    const isEdge = pageNum === 1 || pageNum === (pagination.num_pages ?? 1);
                    const isNear = Math.abs(pageNum - (pagination.page ?? 1)) <= 1;
                    if (isEdge || isNear) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={isActive}
                            href="#"
                            onClick={
                              isActive
                                ? undefined
                                : (e) => {
                                    e.preventDefault();
                                    setPage(pageNum);
                                  }
                            }
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    // Insert ellipsis after first or before last if needed
                    if (
                      (pageNum === 2 && (pagination.page ?? 1) > 3) ||
                      (pageNum === (pagination.num_pages ?? 1) - 1 &&
                        (pagination.page ?? 1) < (pagination.num_pages ?? 1) - 2)
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-${pageNum}`}>
                          {' '}
                          <PaginationEllipsis />{' '}
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      aria-disabled={!pagination.next_page}
                      tabIndex={pagination.next_page ? 0 : -1}
                      onClick={
                        pagination.next_page
                          ? (e) => {
                              e.preventDefault();
                              setPage(pagination.next_page as number);
                            }
                          : undefined
                      }
                      href="#"
                      style={
                        !pagination.next_page ? { pointerEvents: 'none', opacity: 0.5 } : undefined
                      }
                      className={buttonVariants({
                        variant: !pagination.next_page ? 'ghost' : 'ghost',
                        size: 'icon',
                      })}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            {loading || !services ? (
              ''
            ) : (
              <div className="mt-2 text-xs text-gray-500">
                {dict.showingResults
                  .replace('{count}', String(services.length))
                  .replace('{total}', pagination ? String(pagination.count) : '-')}
              </div>
            )}
          </div>
          {/* <pre className="max-h-[400px] overflow-y-auto">
            <code>
              {' '}
              {loading
                ? dict.loading
                : services
                  ? JSON.stringify(services, null, 2)
                  : dict.noServices}
            </code>
          </pre> */}
          {!loading && services && (
            <JsonViewer data={services} className="rounded-md p-4 my-4 border" />
          )}
        </div>
      </main>
    </div>
  );
}
