import { getDictionary } from '../../../_dictionaries';
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
import MultiStepOnboardingForm from '../../../_components/MultiStepOnboardingForm';

export default async function ClientUsagePage({
  params,
}: {
  params: Promise<{ lang: 'en' | 'lv' }>;
}) {
  const { lang } = await params;
  const dict = getDictionary(lang);

  return (
    <div className="font-[family-name:var(--font-geist-sans)] flex flex-col items-center">
      <main className="flex flex-col gap-[32px] items-center sm:items-start w-full max-w-2xl flex-grow">
        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-bold mb-2 ">Onboard user to your service</h2>
          <div className="text-sm/6 font-[family-name:var(--font-geist-mono)]">
            <p>First, you need to onboard the user to your service.</p>
            <p>Get the user&apos;s data and create a new user in your service.</p>
          </div>
          <MultiStepOnboardingForm language={lang} />
        </div>
      </main>
    </div>
  );
}
