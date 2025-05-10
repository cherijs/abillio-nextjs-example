import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppSidebar } from './_components/AppSidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Abillio API Playground',
  description: 'Real life API examples for Abillio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex min-h-screen">
              <AppSidebar lang="en" />
              <main className="flex-1 p-8">
                <SidebarTrigger />
                <div className="flex-1 p-2">{children}</div>
              </main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// import { AppSidebar } from '../_components/AppSidebar';
// import { SidebarTrigger } from '@/components/ui/sidebar';
// import React from 'react';

// export default async function LangLayout({
//   children,
//   params,
// }: {
//   children: React.ReactNode;
//   params: Promise<{ lang: string }>;
// }) {
//   const { lang } = await params;
//   const safeLang = lang === 'en' ? 'en' : 'lv';
//   return (
//     <div className="flex min-h-screen">
//       <AppSidebar lang={safeLang} />
//       <main className="flex-1 p-8">
//         <SidebarTrigger />
//         <div className="flex-1 p-2">{children}</div>
//       </main>
//     </div>
//   );
// }
