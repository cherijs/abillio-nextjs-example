import HomePage from "../_components/HomePage";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "lv" }];
}

export default function Page({ params }: { params: { lang: "en" | "lv" } }) {
  return <HomePage lang={params.lang} />;
} 