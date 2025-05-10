'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCallback } from 'react';
import { ModeToggle } from '@/components/ui/mode-toggle';

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

const NAV_OPTIONS = [
  {
    value: 'client',
    getHref: (lang: string) => `/${lang}`,
    getLabel: (dict: HomePageHeaderDict) => dict.clientSideFetch,
    getDesc: (dict: HomePageHeaderDict) => dict.clientSideFetchDesc,
  },
  {
    value: 'server-fetch',
    getHref: (lang: string) => `/${lang}/server-fetch`,
    getLabel: (dict: HomePageHeaderDict) => dict.serverSideFetch,
    getDesc: (dict: HomePageHeaderDict) => dict.serverSideFetchDesc,
  },
  {
    value: 'direct-abillio',
    getHref: (lang: string) => `/${lang}/direct-abillio`,
    getLabel: (dict: HomePageHeaderDict) => dict.directAbillioFetch,
    getDesc: (dict: HomePageHeaderDict) => dict.directAbillioFetchDesc,
  },
];

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
  const router = useRouter();

  const handleChange = useCallback(
    (value: string) => {
      const nav = NAV_OPTIONS.find((n) => n.value === value);
      if (nav) {
        router.push(nav.getHref(lang));
      }
    },
    [lang, router],
  );

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
        <Link
          href={`/${otherLang}`}
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-12 px-5 sm:w-auto"
        >
          {dict.switchLang} {otherLang.toUpperCase()}
        </Link>
        <a
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-12 px-5  sm:w-auto "
          href="https://api-staging.abill.io/docs/api/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict.readDocs}
        </a>
      </div>
      <div className="w-full sm:w-auto mt-4 sm:mt-0 flex items-center gap-2">
        <ModeToggle />
        <Select value={activePage} onValueChange={handleChange}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Demo variants</SelectLabel>
              {NAV_OPTIONS.map((nav) => (
                <SelectItem key={nav.value} value={nav.value}>
                  <span className="font-semibold">{nav.getLabel(dict)}</span>
                  <span className="block text-xs text-gray-500">{nav.getDesc(dict)}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
