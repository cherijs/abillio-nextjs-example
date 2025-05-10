import { abillioEndpoints } from '../../_components/abillio-endpoints';

export default async function LangSlugPage({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { lang: rawLang, slug } = await params;
  // Garantējam, ka lang ir 'en' vai 'lv'
  const lang: 'en' | 'lv' = rawLang === 'en' ? 'en' : 'lv';
  // Flatten endpoints for easy lookup
  const flatEndpoints = abillioEndpoints.flatMap((group) =>
    group.endpoints.map((ep) => ({ ...ep, group: group.group })),
  );
  // Determine active endpoint
  const activePath = slug ? slug.join('/') : flatEndpoints[0]?.path;
  const activeEndpoint = flatEndpoints.find((ep) => ep.path === activePath) || flatEndpoints[0];

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">{activeEndpoint.label}</h1>
      <div className="text-muted-foreground text-sm mb-2">
        <span className="font-mono bg-muted px-2 py-1 rounded">
          /{lang}/{activeEndpoint?.path}
        </span>
        {/* <div className="mt-4">
          Šeit nākotnē tiks attēlots {activeEndpoint?.label} demonstrācijas saturs.
        </div> */}
      </div>
    </>
  );
}
