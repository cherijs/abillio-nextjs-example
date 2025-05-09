import HomePageDirectAbillio from '../../_components/HomePageDirectAbillio';

export default async function Page({ params }: { params: Promise<{ lang: 'en' | 'lv' }> }) {
  const { lang } = await params;
  return <HomePageDirectAbillio lang={lang} />;
}
