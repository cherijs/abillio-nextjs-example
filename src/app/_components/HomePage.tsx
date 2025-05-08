"use client";

import Image from "next/image";
import Link from "next/link";
import {useEffect} from "react";
// import { abillioApiRequest } from "../../lib/abillio";
import {getDictionary} from "../_dictionaries";
import {useState} from "react";

export default function HomePage({lang} : {
  lang: "en" | "lv"
}) {
  const dict = getDictionary(lang);

  //   version 1 - fetch from our server side that connects to abillio api
  //   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) || "http://localhost:3000";
  //   const res = await fetch(`${baseUrl}/api/abillio/services?lang=${lang}`, {cache: "no-store"});
  //   const services = await res.json();

  //   version 2 - fetch from abillio api directly only on server side, remove "use client"
  //   const services = await abillioApiRequest('services', {}, 'GET', { lang });

  //   version 3 - fetch from abillio api directly with client side fetch currentl solution

  const [services, setServices] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const getServices = async (page : number) => {
    const res = await fetch(`/api/abillio/services?lang=${lang}&p=${page}`);
    const data = await res.json();
    setServices(data.result);
    setPagination(data.pagination);
    setLoading(false);
    return data;
  };

  useEffect(() => {
    setLoading(true);
    getServices(page);
  }, [lang, page]);

  const otherLang = lang === "en"
    ? "lv"
    : "en";

  return (<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      <Image className="invert dark:invert-0" src="https://api-staging.abill.io/docs/api/images/logo-d39433c8.svg" alt="Abillio logo" width={180} height={38} priority="priority"/>
      <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
        <li className="mb-2 tracking-[-.01em]">
          {dict.getStarted}{" "}
          <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
            {dict.envExample}
          </code>{" "}
          {dict.setVars}{" "}
          <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
            {dict.envLocal}
          </code>
        </li>
        <li className="tracking-[-.01em]">{dict.save}</li>
      </ol>

      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <Link href={`/${otherLang}`} className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto">
          Switch to {otherLang.toUpperCase()}
        </Link>

        <a className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto " href="https://api-staging.abill.io/docs/api/" target="_blank" rel="noopener noreferrer">
          {dict.readDocs}
        </a>
      </div>

      <div className="w-full max-w-2xl mt-8">
        <h2 className="text-lg font-bold mb-2 ">{dict.abillioServices}</h2>
        {pagination && (
          <div className="flex gap-2">
            
            <span>
              Page {pagination ? pagination.page : "-"} of {pagination ? pagination.num_pages : "-"}
            </span>
             <button
                          className="underline"
              disabled={!pagination?.previous_page}
              onClick={() => setPage(pagination.previous_page)}
            >
              Previous
            </button>
            <button
              className="underline"
              disabled={!pagination?.next_page}
              onClick={() => setPage(pagination.next_page)}
            >
              Next
            </button>
                      
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">
          Showing {services.length} of {pagination ? pagination.count : "-"} results
        </div>
        <pre className="border border-white/5 p-4 rounded overflow-x-auto text-xs font-[family-name:var(--font-geist-mono)]">
            {loading ? "Loading..." : JSON.stringify(services, null, 2)}
          </pre>
      </div>
    </main>
    <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      <a className="flex items-center gap-2 hover:underline hover:underline-offset-4" href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app" target="_blank" rel="noopener noreferrer">
        <Image aria-hidden="aria-hidden" src="/file.svg" alt="File icon" width={16} height={16}/>
        Learn
      </a>
      <a className="flex items-center gap-2 hover:underline hover:underline-offset-4" href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app" target="_blank" rel="noopener noreferrer">
        <Image aria-hidden="aria-hidden" src="/window.svg" alt="Window icon" width={16} height={16}/>
        Examples
      </a>
      <a className="flex items-center gap-2 hover:underline hover:underline-offset-4" href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app" target="_blank" rel="noopener noreferrer">
        <Image aria-hidden="aria-hidden" src="/globe.svg" alt="Globe icon" width={16} height={16}/>
        Go to nextjs.org →
      </a>
    </footer>
  </div>);
}
