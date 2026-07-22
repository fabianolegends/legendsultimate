import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perguntas Frequentes",
  description: "Tire suas dúvidas sobre participação, bicicletas, navegação por GPS, percurso, logística e inscrições da Legends Ultimate Gravel Race.",
  alternates: { canonical: "/faq" },
  openGraph: { url: "/faq", title: "Perguntas Frequentes | Legends Bike Race", description: "Respostas sobre participação, percurso, logística e inscrições da Legends Ultimate." },
};

const groups = [
  ["Participação", [
    ["A Legends é indicada para iniciantes?", "Não. Não é necessário ser atleta profissional, mas é indispensável estar preparado para quatro dias consecutivos, longa distância e aproximadamente 1.500 metros de ascensão por etapa."],
    ["Posso participar com MTB?", "Sim, no modo Legends Experience, sem classificação, tempo competitivo ou premiação."],
    ["E-bike é permitida?", "Sim, também no modo Legends Experience e sem classificação."],
    ["Cyclocross pode participar?", "Sim, desde que a bicicleta esteja adequada ao terreno e às exigências técnicas do percurso."],
    ["Bike all-road é recomendada?", "Não. O percentual de estradas de terra e cascalho exige uma bicicleta preparada para gravel."],
  ]],
  ["Navegação e percurso", [
    ["Quando recebo o GPX?", "O arquivo oficial será disponibilizado no site uma semana antes do evento."],
    ["Qual GPS devo usar?", "Qualquer equipamento com navegação de percurso e autonomia mínima recomendada de 15 horas."],
    ["O percurso será sinalizado?", "A Legends é por autonavegação. Haverá sinalização apenas em pontos críticos, cruzamentos e acessos a rodovias."],
    ["O que acontece se eu sair do trajeto?", "Você deve retornar ao ponto em que deixou o percurso oficial e retomar o GPX. Cortes podem gerar desclassificação."],
    ["Quantos checkpoints haverá?", "Cada etapa terá dois checkpoints com hidratação e controle por passaporte carimbado."],
  ]],
  ["Logística", [
    ["A organização transporta minha bagagem?", "Sim. Cada participante receberá uma bag de 50 litros, transportada entre as cidades-base."],
    ["Hospedagem está incluída?", "Não. A organização indicará hotéis oficiais e opções adaptadas à dinâmica da prova."],
    ["Alimentação está incluída?", "Não. Jantares e refeições poderão ser oferecidos ou indicados separadamente."],
    ["Pode haver apoio externo?", "Não. O apoio será centralizado pelos veículos oficiais da organização."],
    ["Existe Bike Wash e mecânica?", "Sim. Bike Wash e suporte mecânico básico pós-etapa estão incluídos."],
  ]],
  ["Inscrição e operação", [
    ["A data já foi definida?", "Ainda não. A lista prioritária receberá a data oficial antes da abertura pública."],
    ["Quantas vagas haverá?", "A primeira edição terá limite de 100 participantes."],
    ["Será possível parcelar?", "A previsão é oferecer pagamento em até seis vezes."],
    ["O que está incluído?", "Jersey, camiseta, cap, meias, bag 50 litros, seguro básico, GPX, transporte de bagagem, checkpoints, Bike Wash, mecânica, placa e medalha."],
    ["O que não está incluído?", "Hospedagem, alimentação, transfers, seguro viagem, passagens, massagens e serviços opcionais."],
  ]],
];

export default function FAQ() {
  return <main className="faqPage"><style>{`
    .faqPage{--paper:#f4f0db;--ink:#0b0d0c;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:#111411;color:#f1ece3;min-height:100vh}.wrap{width:min(1120px,calc(100% - 80px));margin:auto}
    .top{height:100px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.logo{height:72px}.back{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.15em}
    .hero{padding:100px 0 80px}.kicker{color:var(--copper);font:600 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.22em}h1,h2{font-family:'Barlow Condensed';text-transform:uppercase;line-height:.9;margin:20px 0}h1{font-size:clamp(70px,9vw,130px)}h2{font-size:clamp(38px,5vw,62px)}.lead{max-width:760px;color:#aab0a7;font-size:18px;line-height:1.75}
    .group{padding:55px 0;border-top:1px solid var(--line)}details{border-bottom:1px solid rgba(198,122,59,.22);padding:22px 0}summary{cursor:pointer;list-style:none;font:600 24px 'Barlow Condensed';text-transform:uppercase}summary:after{content:'+';float:right;color:var(--copper)}details[open] summary:after{content:'–'}details p{max-width:850px;color:#aeb3ab;line-height:1.75}
    .cta{background:var(--paper);color:var(--ink);padding:90px 0;text-align:center}.cta a{display:inline-block;background:var(--copper);padding:18px 28px;margin-top:20px;font:700 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.12em}
    @media(max-width:700px){.wrap{width:calc(100% - 32px)}.top{height:82px}.logo{height:58px}.hero{padding:70px 0}.group{padding:40px 0}summary{font-size:21px}}
  `}</style>
  <nav className="top wrap"><a href="/"><img className="logo" src="/legends-logo-official.png" alt="Legends" /></a><a className="back" href="/">← Voltar à Home</a></nav>
  <section className="hero wrap"><p className="kicker">Perguntas frequentes</p><h1>Antes de partir, entenda tudo.</h1><p className="lead">Esta página reúne as principais informações já definidas. Data, valores, programação final e regras completas serão atualizados quando a primeira edição for oficialmente confirmada.</p></section>
  <section className="wrap">{groups.map(([title,items])=><div className="group" key={title as string}><p className="kicker">{title as string}</p><h2>{title as string}</h2>{(items as string[][]).map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>)}</section>
  <section className="cta"><div className="wrap"><h2>Ainda quer falar com a organização?</h2><a href="mailto:contato@threerace.com.br?subject=Dúvida sobre a Legends">Enviar uma pergunta →</a></div></section>
  </main>;
}
