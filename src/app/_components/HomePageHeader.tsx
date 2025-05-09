import Image from 'next/image';
import Link from 'next/link';

export type HomePageHeaderDict = {
  getStarted: string;
  envExample: string;
  setVars: string;
  envLocal: string;
  save: string;
  switchLang: string;
  readDocs: string;
  clientSideFetch: string;
  clientSideFetchDesc: string;
  serverSideFetch: string;
  serverSideFetchDesc: string;
  directAbillioFetch: string;
  directAbillioFetchDesc: string;
};

export default function HomePageHeader({
  dict,
  otherLang,
  lang,
  activePage,
}: {
  dict: HomePageHeaderDict;
  otherLang: string;
  lang: string;
  activePage: 'client' | 'server-fetch' | 'direct-abillio';
}) {
  return (
    <>
      <Image
        className="invert dark:invert-0"
        src="https://api-staging.abill.io/docs/api/images/logo-d39433c8.svg"
        alt="Abillio logo"
        width={180}
        height={38}
        priority
      />
      <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
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
        <li className="tracking-[-.01em]">{dict.save}</li>
      </ol>
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <Link
          href={`/${otherLang}`}
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
        >
          {dict.switchLang} {otherLang.toUpperCase()}
        </Link>
        <a
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto "
          href="https://api-staging.abill.io/docs/api/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.readDocs}
        </a>

        {/* Navigation for demo variants */}

        <Link
          href={`/${lang}`}
          className={`rounded-full border h-10 sm:h-12  border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-xs py-2 px-4 sm:px-5 w-full sm:w-auto text-center  ${activePage === 'client' ? '!bg-white !text-black' : ''}`}
        >
          {dict.clientSideFetch}
          <br />
          {dict.clientSideFetchDesc}
        </Link>
        <Link
          href={`/${lang}/server-fetch`}
          className={`rounded-full border h-10 sm:h-12  border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-xs py-2 px-4 sm:px-5 w-full sm:w-auto text-center  ${activePage === 'server-fetch' ? '!bg-white !text-black' : ''}`}
        >
          {dict.serverSideFetch}
          <br />
          {dict.serverSideFetchDesc}
        </Link>
        <Link
          href={`/${lang}/direct-abillio`}
          className={`rounded-full border h-10 sm:h-12  border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-xs py-2 px-4 sm:px-5 w-full sm:w-auto text-center  ${activePage === 'direct-abillio' ? '!bg-white !text-black' : ''}`}
        >
          {dict.directAbillioFetch}
          <br />
          {dict.directAbillioFetchDesc}
        </Link>
      </div>
    </>
  );
}
