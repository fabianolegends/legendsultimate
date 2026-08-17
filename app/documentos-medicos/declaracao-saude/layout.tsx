import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Declaração de Saúde 2027",
  robots: { index: false, follow: false },
};

export default function DeclaracaoSaudeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
