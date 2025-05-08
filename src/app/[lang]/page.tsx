import HomePage from "../_components/HomePage";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "lv" }];
}

export default async function Page({ params }: { params: Promise<{ lang: "en" | "lv" }> }) {
  const { lang } = await params;
  return <HomePage lang={lang} />;
} 