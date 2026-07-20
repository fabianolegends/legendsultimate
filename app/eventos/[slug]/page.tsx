import RegistrationClient from "./RegistrationClient";

export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RegistrationClient slug={slug}/>;
}
