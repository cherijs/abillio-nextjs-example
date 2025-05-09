import HomePageServerFetch from '../../_components/HomePageServerFetch';

export default async function Page({ params }: { params: Promise<{ lang: 'en' | 'lv' }> }) {
  const { lang } = await params;
  return <HomePageServerFetch lang={lang} />;
}
