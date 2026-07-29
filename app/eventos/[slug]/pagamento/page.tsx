import PaymentStatusClient from "./PaymentStatusClient";

export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ resultado?: string; modo?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  return <PaymentStatusClient slug={slug} result={query.resultado ?? "sucesso"} testMode={query.modo === "teste"}/>;
}
