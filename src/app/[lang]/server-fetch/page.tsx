import HomePageServerFetch from '../../_components/HomePageServerFetch';

export default async function Page({ params }: { params: { lang: 'en' | 'lv' } }) {
  return <HomePageServerFetch lang={params.lang} />;
}
