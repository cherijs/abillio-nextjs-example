'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { abillioEndpoints } from './abillio-endpoints';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppSidebar({ lang, activePath }: { lang: string; activePath?: string }) {
  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center justify-between py-4 px-4">
          <div className="flex-grow">
            <Link href={`/${lang}`} className="text-xl font-bold tracking-tight">
              <svg
                className="w-auto h-8"
                width="126"
                height="38"
                viewBox="0 0 126 38"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M112.285 37.9189C119.471 37.9189 125.307 32.0933 125.307 24.8969C125.307 17.701 119.471 11.875 112.285 11.875C105.099 11.875 99.2631 17.701 99.2631 24.8969C99.2631 32.0933 105.089 37.9189 112.285 37.9189ZM112.305 31.1493C115.807 31.1493 118.649 28.3075 118.649 24.8058C118.649 21.3041 115.807 18.4623 112.305 18.4623C108.804 18.4623 105.962 21.3041 105.962 24.8058C105.962 28.3075 108.804 31.1493 112.305 31.1493Z"
                ></path>
                <path d="M19.3858 11.9765V13.5395C17.5079 12.484 15.3363 11.875 13.0219 11.875C5.82598 11.875 0 17.701 0 24.8969C0 32.0933 5.82598 37.9189 13.0219 37.9189C15.3363 37.9189 17.5079 37.3202 19.3858 36.2543V37.9596H26.0846V11.9765H19.3858ZM13.0423 31.1493C9.54066 31.1493 6.6988 28.3075 6.6988 24.8058C6.6988 21.3041 9.54066 18.4623 13.0423 18.4623C16.544 18.4623 19.3858 21.3041 19.3858 24.8058C19.3858 28.3075 16.544 31.1493 13.0423 31.1493Z"></path>
                <path d="M58.5632 38V12.9916H65.2724V38H58.5632Z"></path>
                <path d="M65.465 4.26296C65.465 2.27354 63.902 0.710541 61.9633 0.710541C60.0858 0.710541 58.5124 2.27354 58.4617 4.26296C58.4617 6.14048 60.0251 7.71348 61.9633 7.71348C63.9527 7.71348 65.465 6.15048 65.465 4.26296Z"></path>
                <path d="M96.5228 4.31371C96.5228 2.30391 94.9598 0.710541 93.0211 0.710541C91.1436 0.710541 89.5702 2.30391 89.5195 4.31371C89.5195 6.22161 91.0825 7.81499 93.0211 7.81499C95.0105 7.81499 96.5228 6.22161 96.5228 4.31371Z"></path>
                <path d="M89.621 37.98H96.3302V12.9916H89.621V37.98Z"></path>
                <path d="M42.7605 11.875C40.4666 11.875 38.3149 12.474 36.437 13.5091V0.710563C36.437 0.152266 36.011 0 35.5338 0C35.0566 0 34.5391 0.355279 34.5391 0.355279L29.7386 2.88261V37.9596H36.437V36.2847C38.3045 37.3302 40.4666 37.9189 42.7605 37.9189C49.9461 37.9189 55.7825 32.0933 55.7825 24.8969C55.7825 17.701 49.9461 11.875 42.7605 11.875ZM42.7805 31.1493C39.2789 31.1493 36.437 28.3075 36.437 24.8058C36.437 21.3041 39.2789 18.4623 42.7805 18.4623C46.2822 18.4623 49.124 21.3041 49.124 24.8058C49.124 28.3075 46.2822 31.1493 42.7805 31.1493Z"></path>
                <path d="M74.7111 6.29279C74.2343 6.29279 73.7168 6.64806 73.7168 6.64806L68.9159 9.1754V37.9596H75.6147V7.56164V7.00335C75.6147 6.44505 75.1883 6.29279 74.7111 6.29279Z"></path>
                <path d="M85.0639 0.304535C84.5871 0.304535 84.0692 0.659814 84.0692 0.659814L79.2686 3.18676V37.9596H85.9674V1.57301V1.11622V1.01509C85.9674 0.456795 85.541 0.304535 85.0639 0.304535Z"></path>
              </svg>
            </Link>
          </div>
          <div className="flex justify-end gap-2">
            <LanguageSwitcher />
            <ModeToggle />
          </div>
        </div>

        {abillioEndpoints.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.endpoints.map((ep) => (
                  <SidebarMenuItem key={ep.path}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/${lang}/${ep.path}`}
                        className={`w-full text-left ${activePath === ep.path ? 'bg-accent font-semibold' : ''}`}
                        data-active={activePath === ep.path ? 'true' : undefined}
                        prefetch={false}
                        scroll={false}
                      >
                        {ep.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
