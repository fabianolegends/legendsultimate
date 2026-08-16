import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista Prioritária",
  description: "Entre para a lista prioritária da Legends Bike Race e receba primeiro o link de abertura das inscrições e as novidades oficiais.",
  alternates: { canonical: "/lista-prioritaria" },
  openGraph: {
    url: "/lista-prioritaria",
    title: "Lista Prioritária | Legends Bike Race",
    description: "Receba primeiro o link de abertura das inscrições e as novidades oficiais.",
  },
};

export default function PriorityListLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
