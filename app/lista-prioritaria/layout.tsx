import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista Prioritária",
  description: "Entre para a lista prioritária da Legends Ultimate Gravel Race e receba primeiro a data oficial, valores e abertura das inscrições.",
  alternates: { canonical: "/lista-prioritaria" },
  openGraph: {
    url: "/lista-prioritaria",
    title: "Lista Prioritária | Legends Ultimate Gravel Race",
    description: "Receba primeiro a data oficial, valores e abertura das inscrições.",
  },
};

export default function PriorityListLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
