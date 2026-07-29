import RegistrationClient from "./RegistrationClient";

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <RegistrationClient slug={slug} testMode={query.modo === "teste"}/>;
}
