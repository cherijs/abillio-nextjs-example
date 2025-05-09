import HomePageDirectAbillio from '../../_components/HomePageDirectAbillio';

export default async function Page({ params }: { params: { lang: 'en' | 'lv' } }) {
  return <HomePageDirectAbillio lang={params.lang} />;
}
