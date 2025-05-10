import { AppSidebar } from '../_components/AppSidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import React from 'react';

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const safeLang = lang === 'en' ? 'en' : 'lv';
  return (
    <div className="flex min-h-screen">
      <AppSidebar lang={safeLang} />
      <main className="flex-1 p-8">
        <SidebarTrigger />
        <div className="flex-1 p-2">{children}</div>
      </main>
    </div>
  );
}
