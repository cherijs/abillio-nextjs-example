export default async function Page({ params }: { params: Promise<{ test: string }> }) {
  const { test } = await params;
  return <div>{test}</div>;
}
