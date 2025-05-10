import { getDictionary } from '../../../_dictionaries';
import HomePageHeader from '../../../_components/Header';
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

export default async function ClientUsagePage({
  params,
}: {
  params: Promise<{ lang: 'en' | 'lv' }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  // Server-side fetch
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/abillio/services?lang=${lang}&country=LV&p=1`,
    { cache: 'no-store' },
  );
  const data = await res.json();
  const services = data.result;
  const pagination = data.pagination;

  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <main className="flex flex-col gap-[32px] items-center sm:items-start w-full max-w-2xl flex-grow">
        <HomePageHeader dict={dict} />
        <div className="flex flex-col gap-4">
          <Badge variant="secondary">Client component</Badge>
          <h2 className="text-lg font-bold mb-2 ">{dict.clientSideFetch}</h2>
          <div className="flex flex-col gap-2">
            <p
              className="text-sm/6 font-[family-name:var(--font-geist-mono)]"
              dangerouslySetInnerHTML={{ __html: dict.clientInfo }}
            />
            <p
              className="text-sm/6 font-[family-name:var(--font-geist-mono)]"
              dangerouslySetInnerHTML={{ __html: dict.clientCaveats }}
            />
            <p className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
              {dict.requestExampleClient}
            </p>
            <pre>{`fetch('/api/abillio/services?lang=' + lang)
  .then(res => res.json())
  .then(data => {
    // ...
  });
`}</pre>
          </div>
        </div>
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
                    const isActive = pageNum === pagination.page;
                    const isEdge = pageNum === 1 || pageNum === (pagination.num_pages ?? 1);
                    const isNear = Math.abs(pageNum - (pagination.page ?? 1)) <= 1;
                    if (isEdge || isNear) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={isActive}
                            href="#"
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    if (
                      (pageNum === 2 && (pagination.page ?? 1) > 3) ||
                      (pageNum === (pagination.num_pages ?? 1) - 1 &&
                        (pagination.page ?? 1) < (pagination.num_pages ?? 1) - 2)
                    ) {
                      return (
                        <PaginationItem key={`ellipsis-${pageNum}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      aria-disabled={!pagination.next_page}
                      tabIndex={pagination.next_page ? 0 : -1}
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
            <div className="mt-2 text-xs text-gray-500">
              {dict.showingResults
                .replace('{count}', String(services.length))
                .replace('{total}', pagination ? String(pagination.count) : '-')}
            </div>
          </div>
          <JsonViewer data={services} className="rounded-md p-4 my-4 border" />
        </div>
      </main>
    </div>
  );
}
