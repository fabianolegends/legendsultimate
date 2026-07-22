import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade e uso de cookies da Legends Bike Race.",
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0b0f0d", color: "#eee8dd", padding: "64px 24px" }}>
      <article style={{ maxWidth: 820, margin: "0 auto", lineHeight: 1.7 }}>
        <Link href="/" style={{ color: "#c77b3c", textTransform: "uppercase", letterSpacing: ".12em" }}>
          ← Voltar ao site
        </Link>
        <h1 style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", lineHeight: 1, margin: "48px 0 28px" }}>
          Política de Privacidade
        </h1>
        <p>Última atualização: 22 de julho de 2026.</p>
        <h2>Dados que coletamos</h2>
        <p>Quando você se inscreve na lista prioritária, coletamos os dados informados no formulário para responder ao seu interesse e enviar comunicações relacionadas à Legends Bike Race.</p>
        <p>Com seu consentimento, usamos Google Analytics e Meta Pixel para entender visitas, navegação e conversões. Essas ferramentas podem registrar informações técnicas como dispositivo, navegador, páginas visitadas e origem do acesso.</p>
        <h2>Como usamos os dados</h2>
        <p>Usamos os dados para administrar a lista prioritária, enviar informações sobre o evento, melhorar o site, medir campanhas e entender o interesse do público. Não comercializamos seus dados pessoais.</p>
        <h2>Cookies e sua escolha</h2>
        <p>Cookies essenciais permitem o funcionamento do site. Cookies de análise e marketing são ativados somente após sua autorização. Você pode revisar sua escolha pelo botão “Privacidade” exibido no site.</p>
        <h2>Compartilhamento e armazenamento</h2>
        <p>Os dados podem ser processados por fornecedores necessários à operação do site, da lista de interessados e das métricas, sempre dentro das finalidades descritas nesta política.</p>
        <h2>Seus direitos</h2>
        <p>Você pode solicitar confirmação, acesso, correção, exclusão ou informações sobre o tratamento de seus dados, além de revogar o consentimento quando aplicável.</p>
        <h2>Contato</h2>
        <p>Para exercer seus direitos ou esclarecer dúvidas, escreva para <a href="mailto:contato@legendsbikerace.com.br" style={{ color: "#c77b3c" }}>contato@legendsbikerace.com.br</a>.</p>
      </article>
    </main>
  );
}
