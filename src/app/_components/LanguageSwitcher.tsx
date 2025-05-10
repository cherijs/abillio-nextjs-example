'use client';

import { Languages } from 'lucide-react'; // Using Languages icon
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define supported languages (could also come from i18n config)
const languages = [
  { code: 'en', name: 'English' },
  { code: 'lv', name: 'Latviešu' },
];

// Helper, lai nomainītu valodu URL
function getPathWithLocale(pathname: string, locale: string) {
  const segments = pathname.split('/');
  if (languages.some((l) => l.code === segments[1])) {
    segments[1] = locale;
  } else {
    segments.splice(1, 0, locale);
  }
  return segments.join('/') || '/';
}

export const LanguageSwitcher: React.FC<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  align?: 'start' | 'center' | 'end';
}> = ({ variant = 'ghost', align = 'end' }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => router.push(getPathWithLocale(pathname, lang.code))}
            className={pathname.startsWith(`/${lang.code}`) ? 'font-semibold' : ''}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
