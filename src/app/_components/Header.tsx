'use client';

export type HomePageHeaderDict = {
  getStarted: string;
  envExample: string;
  setVars: string;
  envLocal: string;
  register: string;
  switchLang: string;
  readDocs: string;
  clientSideFetch: string;
  clientSideFetchDesc: string;
  serverSideFetch: string;
  serverSideFetchDesc: string;
  directAbillioFetch: string;
  directAbillioFetchDesc: string;
};

export default function HomePageHeader({ dict }: { dict: HomePageHeaderDict }) {
  return (
    <>
      <ol className="list-inside list-decimal text-sm/6 text-left font-[family-name:var(--font-geist-mono)]">
        <li className="tracking-[-.01em]">{dict.register}</li>
        <li className="mb-2 tracking-[-.01em]">
          {dict.getStarted}{' '}
          <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
            {dict.envExample}
          </code>{' '}
          {dict.setVars}{' '}
          <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
            {dict.envLocal}
          </code>
        </li>
      </ol>
      <div className="flex gap-4 items-center flex-row  w-full">
        <a
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-12 px-5  sm:w-auto "
          href="https://api-staging.abill.io/docs/api/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.readDocs}
        </a>
      </div>
    </>
  );
}
