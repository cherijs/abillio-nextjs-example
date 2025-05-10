import HomePageHeader from './_components/Header';
import { getDictionary } from './_dictionaries';

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  // Garantējam, ka lang ir 'en' vai 'lv'
  const lang: 'en' | 'lv' = rawLang === 'en' ? 'en' : 'lv';
  const dict = getDictionary(lang);

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Playground</h1>
      <HomePageHeader dict={dict} />
    </>
  );
}
