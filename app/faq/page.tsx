import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dúvidas sobre a Legends Bike Race 2027",
  description: "Encontre respostas sobre inscrições, participação, bicicletas, GPS, SPOT, percursos, logística e regras da Legends Bike Race 2027.",
  alternates: { canonical: "/faq" },
  openGraph: { url: "/faq", title: "Perguntas Frequentes | Legends Bike Race 2027", description: "Respostas atualizadas para a Legends Bike Race 2027." },
};

const groups = [
  ["Participação", [
    ["Quais são os formatos da Legends Bike Race 2027?", "A Legends Ultimate acontece de 29 de abril a 2 de maio, com quatro etapas. A Legends Short acontece em 1º e 2 de maio e reúne as Stages 03 e 04."],
    ["Quantas vagas haverá?", "A Legends Ultimate terá 100 vagas e a Legends Short terá 50 vagas, com inscrições e controles independentes."],
    ["Ultimate e Short pedalam juntas?", "Sim. Nas Stages 03 e 04 os participantes dos dois formatos compartilham o percurso e a estrutura, mas as classificações e premiações da Gravel Race são separadas."],
    ["A Legends é indicada para iniciantes?", "Não. Não é necessário ser atleta profissional, mas é indispensável estar preparado para as distâncias, altimetria, estradas não pavimentadas e autonavegação do formato escolhido."],
    ["Posso participar com MTB?", "Sim, exclusivamente na Legends Experience, modalidade não competitiva, sem classificação ou premiação esportiva."],
    ["E-Bike é permitida?", "Sim, exclusivamente na Legends Experience e somente E-Bikes de pedal assistido. Bicicletas com acelerador ou propulsão independente da pedalada não são permitidas."],
    ["Cyclocross pode participar?", "Sim. Gravel e Cyclocross sem assistência elétrica podem participar da Legends Gravel Race."],
  ]],
  ["Inscrição e documentos", [
    ["Quais são os valores?", "Legends Ultimate: Lote 01 R$ 999, Lote 02 R$ 1.199 e Lote 03 R$ 1.399. Legends Short: Lote 01 R$ 699, Lote 02 R$ 799 e Lote 03 R$ 899."],
    ["Onde será feita a inscrição?", "A inscrição e o pagamento serão processados pela plataforma oficial Windfit. O botão será ativado no site no momento autorizado para abertura."],
    ["O atestado médico é obrigatório?", "Sim. Para liberação do participante serão obrigatórios o Atestado Médico e a Declaração de Saúde oficial da Legends Bike Race, devidamente preenchidos e assinados."],
    ["Como funciona o cancelamento?", "Além dos direitos legalmente obrigatórios, o Regulamento prevê percentuais de reembolso conforme a antecedência do pedido. Consulte a seção de cancelamento no Regulamento Oficial."],
    ["Posso transferir minha inscrição?", "Sim, uma vez e até 30 dias antes do evento. No mesmo lote, a taxa é de R$ 100. Se a transferência ocorrer em lote posterior, será cobrada a diferença para o lote vigente, respeitado o mínimo de R$ 100."],
    ["Posso trocar de formato ou modalidade?", "Sim, até 15 dias antes do evento, mediante disponibilidade, aprovação da Organização e eventual regularização de diferença financeira."],
  ]],
  ["Navegação, checkpoints e Race Engine", [
    ["Como funciona a navegação?", "A Legends utiliza autonavegação. O percurso oficial será disponibilizado em GPX e cada participante é responsável por carregar a rota, conhecer seu GPS e manter autonomia suficiente de bateria."],
    ["O percurso será sinalizado?", "A sinalização física é complementar e não substitui o GPS. A referência principal é o percurso oficial carregado no dispositivo do participante."],
    ["O que acontece se eu sair do trajeto?", "O participante deve retornar ao ponto em que deixou o percurso oficial antes de continuar. Atalhos ou reconexões em ponto posterior podem gerar penalização ou desclassificação."],
    ["Quantos checkpoints haverá?", "A quantidade final será divulgada operacionalmente. As etapas poderão utilizar checkpoints físicos e digitais para controle, hidratação, segurança, horários e segmentos."],
    ["Como funciona o Race Engine?", "O Legends Race Engine poderá analisar GPS, FIT, GPX, atividades sincronizadas, checkpoints, horários, direção, aderência ao percurso, dados de rastreamento e registros oficiais. Inconsistências podem ser submetidas à revisão humana."],
  ]],
  ["Logística e segurança", [
    ["A organização transporta minha bagagem?", "Sim. Cada participante recebe uma bag oficial de 50 litros, que será transportada entre as cidades-base de acordo com locais, horários, identificação e limite de peso definidos no Manual do Atleta."],
    ["O transporte do atleta está incluído?", "Não deve ser considerado incluído. Até que a Organização divulgue eventual serviço específico, o participante deve planejar seus próprios deslocamentos."],
    ["Hospedagem está incluída?", "Não. A Organização poderá indicar hotéis oficiais e parceiros, mas hospedagem deve ser contratada separadamente."],
    ["Alimentação está incluída?", "Refeições não estão incluídas. A inscrição contempla hidratação nos checkpoints oficiais e eventuais itens oferecidos pela Organização nesses pontos."],
    ["O que é o SPOT?", "É o rastreador satelital utilizado durante todas as etapas para monitoramento e segurança. O participante deve mantê-lo consigo, ligado e devolvê-lo conforme as orientações da Organização."],
    ["Existe Bike Wash e mecânica?", "Sim. Bike Wash ao final das etapas e mecânica básica disponibilizada pela Danda Bike estão incluídos. Peças, componentes e manutenção Premium não estão incluídos."],
    ["Pode haver apoio externo na Gravel Race?", "Não é permitido apoio particular programado. São permitidos apoio oficial, mecânica oficial, checkpoints, estabelecimentos abertos ao público, auxílio espontâneo entre participantes e auxílio emergencial."],
  ]],
  ["Categorias e classificação", [
    ["Quais são as categorias masculinas?", "Open Masculino 18–29, Master A 30–39, Master B 40–49 e Senior 50+. A idade considerada é a que o atleta completa no ano-base da competição."],
    ["Quais são as categorias femininas?", "Feminino A 18–40 e Feminino B 41+, considerando a idade no ano-base da competição."],
    ["Existe número mínimo por categoria?", "Sim. São necessários cinco atletas inscritos e confirmados por categoria. Se o mínimo não for atingido, a categoria será incorporada à imediatamente anterior conforme o Regulamento."],
    ["As categorias são iguais nos dois formatos?", "Sim. Ultimate e Short usam as mesmas quatro categorias masculinas e duas femininas na Gravel Race, sempre com rankings separados."],
    ["Como funciona a classificação geral?", "A Gravel Race utiliza pontos. A Ultimate soma as Stages 01 a 04; a Short soma somente as Stages 03 e 04. As classificações são independentes."],
    ["Como funciona a premiação?", "Na Ultimate, recebem troféus do 1º ao 5º de cada categoria. Na Short, recebem troféus do 1º ao 3º de cada categoria."],
    ["Qual é o prazo para protesto ou revisão?", "Até 30 minutos após a publicação do resultado provisório da etapa, pelo canal definido pela Organização."],
  ]],
];

export default function FAQ() {
  return <main className="faqPage"><style>{`
    .faqPage{--paper:#f4f0db;--ink:#0b0d0c;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:#0b0d0c;color:#f4f0db;min-height:100vh}.wrap{width:min(1120px,calc(100% - 80px));margin:auto}
    .top{height:100px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.logo{height:72px}.back{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.15em}
    .kicker{color:var(--copper);font:600 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.22em}h1,h2{color:#f4f0db;font-family:'Barlow Condensed';text-transform:uppercase;line-height:.9;margin:20px 0}h1{font-size:clamp(37.8px,4.9vw,61.6px)}h2{font-size:clamp(38px,5vw,62px)}
    .questions{scroll-margin-top:0;padding-top:56px}.questionsHead{padding-bottom:38px}.questionsHead h1{margin-bottom:0}.group{padding:48px 0;border-top:1px solid var(--line)}details{border-bottom:1px solid rgba(198,122,59,.28);padding:22px 0}summary{cursor:pointer;list-style:none;color:#f4f0db;font:600 24px 'Barlow Condensed';text-transform:uppercase}summary:after{content:'+';float:right;color:var(--copper)}details[open] summary:after{content:'–'}details p{max-width:900px;color:#aeb3ab;line-height:1.75}
    .cta{background:var(--paper);color:var(--ink);padding:90px 0;text-align:center}.cta h2{color:var(--ink)}.ctaLinks{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}.cta a{display:inline-block;background:var(--copper);color:#fff;padding:18px 28px;margin-top:20px;font:700 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.12em}.cta a.alt{background:#111411}
    @media(max-width:700px){.wrap{width:calc(100% - 32px)}.top{height:82px}.logo{height:58px}.questions{padding-top:32px}.questionsHead{padding-bottom:24px}.questionsHead h1{font-size:32.2px}.group{padding:30px 0}summary{font-size:21px}}
  `}</style>
  <nav className="top wrap"><a href="/"><img className="logo" src="/legends-logo-official.png" alt="Legends" /></a><a className="back" href="/">← Voltar à home</a></nav>
  <section id="perguntas" className="wrap questions"><header className="questionsHead"><p className="kicker">Legends Bike Race 2027</p><h1>Perguntas frequentes sobre a prova de gravel.</h1></header>{groups.map(([title,items])=><div className="group" key={title as string}><p className="kicker">{title as string}</p><h2>{title as string}</h2>{(items as string[][]).map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>)}</section>
  <section className="cta"><div className="wrap"><h2>Leia os documentos antes de se inscrever.</h2><div className="ctaLinks"><a href="/regulamento">Regulamento oficial →</a><a className="alt" href="/inscricoes">Ver inscrições →</a></div></div></section>
  </main>;
}
