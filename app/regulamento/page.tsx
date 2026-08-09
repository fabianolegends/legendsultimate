import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamento Oficial 2027",
  description: "Regulamento Oficial da Legends Bike Race 2027, de 29 de abril a 2 de maio na Serra Gaúcha.",
  alternates: { canonical: "/regulamento" },
};

const sections = [
  ["1", "Do evento", [
    "A Legends Bike Race é um evento ciclístico de longa distância em formato Stage Race, realizado em quatro etapas consecutivas na Serra Gaúcha, com características de travessia, autonavegação e deslocamento entre diferentes cidades-base.",
    "A edição 2027 será realizada entre 29 de abril e 2 de maio de 2027, com aproximadamente 370,3 km e 6.302 m+ acumulados: Stage 01 Canela — 111,9 km / 1.684 m+; Stage 02 São Francisco de Paula — 89,1 km / 1.520 m+; Stage 03 Gramado — 99,3 km / 1.522 m+; Stage 04 Nova Petrópolis → Canela — 70,0 km / 1.576 m+.",
    "Distâncias, altimetrias, traçado, largadas, chegadas, checkpoints e horários poderão sofrer ajustes técnicos por segurança, condição das vias, autorização pública, meteorologia ou razões operacionais. A edição terá limite inicial de 100 participantes."
  ]],
  ["2", "Modalidades", [
    "Legends Gravel Race: modalidade competitiva para bicicletas Gravel ou Cyclocross sem qualquer assistência motorizada, com cronometragem, checkpoints, validação, pontuação, classificação e premiação.",
    "Legends Experience: modalidade não competitiva para Gravel, Mountain Bikes e E-Bikes de pedal assistido. Não integra ranking geral, classificação por categoria, pontuação oficial ou premiação esportiva."
  ]],
  ["3", "Elegibilidade e documentação", [
    "Poderão participar pessoas com 18 anos ou mais no ano-base da competição. O participante declara possuir condição física, técnica e psicológica compatível com quatro dias consecutivos de longa distância, altimetria elevada, estradas não pavimentadas, trânsito compartilhado e autonavegação.",
    "É obrigatória a apresentação de Atestado Médico válido e Declaração de Saúde oficial da Legends Bike Race, devidamente preenchidos e assinados. A ausência, irregularidade ou fraude documental poderá impedir a participação ou gerar desclassificação."
  ]],
  ["4", "Categorias — Legends Gravel Race", [
    "Masculino: Open 18–29; Master A 30–39; Master B 40–49; Senior 50+. Feminino: Feminino A 18–40; Feminino B 41+.",
    "Para a categoria será considerada a idade que o participante completar no ano-base da competição, independentemente do dia ou mês do aniversário.",
    "É exigido mínimo de 5 atletas inscritos e confirmados por categoria. Se o mínimo não for atingido, aplica-se o agrupamento: Senior → Master B → Master A → Open Masculino; Feminino B → Feminino A. Open Masculino e Feminino A poderão ser mantidas ou reorganizadas por decisão da Organização."
  ]],
  ["5", "Bicicletas", [
    "Gravel Race: somente Gravel ou Cyclocross movidas exclusivamente pela força humana. E-Bikes não podem competir mesmo com o sistema elétrico desligado.",
    "Experience: Gravel, MTB e E-Bikes exclusivamente de pedal assistido. Não são permitidos acelerador, propulsão independente da pedalada, motocicletas elétricas ou ciclomotores. A autonomia da bateria é responsabilidade do participante."
  ]],
  ["6", "Itens incluídos e não incluídos", [
    "Incluídos: participação nas quatro etapas; camiseta casual; bag oficial 50 L; cap de ciclismo; SPOT; placa; medalha conforme critérios; transporte da bag entre cidades-base; hidratação; GPX; checkpoints; Race Engine quando aplicável; apuração e monitoramento satelital; seguro básico conforme apólice; apoio; comunicação e rastreamento; segurança e resgate; Bike Wash; mecânica básica Danda Bike; briefings; estrutura de largada/chegada e logística oficial.",
    "Não incluídos: Kit Premium; hospedagem; refeições; nutrição pessoal além do oferecido oficialmente; transporte do participante; passagens; transporte da bicicleta; combustível; estacionamento; pedágios; equipamentos obrigatórios; GPS; telefone; bicicleta; manutenção Premium; peças e componentes; mecânica particular; fisioterapia, massagem e recovery; despesas médicas não cobertas; medicamentos; exames; emissão do atestado; turismo, atividades opcionais, upgrades e demais produtos/serviços não relacionados entre os incluídos.",
    "O SPOT deverá ser retirado, mantido com o participante, utilizado conforme orientação, não desligado ou entregue a terceiros e devolvido no período definido. Perda ou dano por uso inadequado poderá gerar cobrança.",
    "A bag transportada será exclusivamente a oficial de 50 L, observando local, horário, identificação, limite de peso e regras do Manual do Atleta. A mecânica Danda Bike é básica; peças e materiais poderão ser cobrados."
  ]],
  ["7", "Equipamentos obrigatórios", [
    "Capacete afivelado; GPS com navegação; percurso oficial carregado; telefone funcional; documento de identificação; hidratação; alimentação; ferramentas básicas; bomba ou CO₂; reparo de pneus; câmara ou solução equivalente; luz traseira; equipamento de rastreamento fornecido pela Organização, quando houver.",
    "A Organização poderá acrescentar itens conforme clima e características da etapa. A falta de item obrigatório poderá impedir a largada ou gerar penalização."
  ]],
  ["8", "Autonavegação", [
    "O percurso oficial será disponibilizado eletronicamente. É responsabilidade do participante baixar e carregar a rota, conhecer o GPS, possuir bateria suficiente, interpretar a navegação e permanecer no percurso.",
    "A sinalização física é complementar. Ao sair involuntariamente do percurso, o atleta deverá retornar ao ponto de saída antes de continuar. Atalho ou reconexão em ponto posterior caracteriza corte de percurso."
  ]],
  ["9", "Legends Race Engine", [
    "A validação poderá utilizar GPS, FIT, GPX, atividades sincronizadas, checkpoints, horários, sequência, direção, aderência ao percurso, registros de fiscais, dados de rastreamento e informações operacionais.",
    "A validação automática poderá ser revisada por equipe humana. O arquivo original do GPS poderá ser solicitado. Manipulação, falsificação ou fabricação de arquivo eletrônico constitui fraude esportiva."
  ]],
  ["10", "Checkpoints", [
    "Cada etapa poderá possuir checkpoints físicos ou digitais para controle de passagem, hidratação, apoio, segurança, segmentos e controle de horário. O participante deve cumprir todos os checkpoints obrigatórios na sequência determinada.",
    "Falhas de registro poderão ser revistas. Se a passagem não puder ser comprovada, poderão ser aplicados DNF, penalização ou desclassificação."
  ]],
  ["11", "Tempo oficial", ["Para fins competitivos será considerado tempo decorrido. Paradas para alimentação, hidratação, mecânica, descanso, navegação ou necessidades pessoais integram o tempo de prova. Auto Pause não altera o tempo oficial."]],
  ["12", "Tempos-limite", ["Stage 01: 10 horas; Stage 02: 9 horas; Stage 03: 10 horas; Stage 04: 6 horas. Poderão existir cortes intermediários. Ultrapassar o tempo máximo resulta em DNF na etapa."]],
  ["13", "Abandono", ["Qualquer abandono deve ser comunicado imediatamente por checkpoint, equipe de segurança, equipe médica, telefone de emergência, Race Control ou veículo oficial. É proibido deixar o percurso sem avisar. Equipamentos da Organização deverão ser devolvidos."]],
  ["14", "Resgate e retirada", ["A prioridade absoluta é preservar vida e integridade física. Organização, equipe médica ou Direção de Prova poderão retirar um participante quando sua permanência representar risco. Decisão médica relacionada à continuidade prevalece sobre a vontade do participante."]],
  ["15", "Auxílio externo", ["Na Gravel Race é proibido apoio particular programado, incluindo veículos particulares de suporte, entrega programada de alimentação, equipamentos ou peças, troca programada de bicicleta, acompanhamento por veículo, reboque, impulsão e vácuo deliberado atrás de veículo motorizado.", "São permitidos apoio oficial, mecânica oficial, checkpoints, estabelecimentos abertos ao público, assistência espontânea entre participantes e auxílio emergencial."]],
  ["16", "Vias públicas e trânsito", ["Os percursos poderão usar vias abertas ao trânsito. O participante não possui exclusividade ou prioridade absoluta e deve respeitar Código de Trânsito, sinalização, preferências, determinações das autoridades, moradores, veículos, pedestres e animais."]],
  ["17", "Fair play e conduta", ["São obrigatórios respeito, fair play, ética esportiva, proteção ambiental e respeito às comunidades. São proibidos descarte irregular de lixo, agressão, intimidação, discriminação, alteração de sinalização, dano à propriedade, obstrução deliberada de outro participante e conduta que coloque terceiros em risco."]],
  ["18", "Classificação por pontos", ["A classificação geral da Gravel Race será baseada na soma dos pontos válidos. Coeficientes: Stage 01 1,15; Stage 02 1,00; Stage 03 1,20; Stage 04 0,65.", "Referência: Pontos = 1.000 × (melhor tempo válido da categoria ÷ tempo válido do atleta) × coeficiente da etapa."]],
  ["19", "DNS, DNF e DSQ", ["DNS: não largou. DNF: largou, mas não concluiu validamente. DSQ: desclassificado. Um atleta com DNF poderá ser autorizado a largar a etapa seguinte, sem recuperar os pontos perdidos. Infração grave poderá resultar em desclassificação de todo o evento."]],
  ["20", "Desempates", ["Ordem: maior número de vitórias em etapas; melhor pontuação na Stage 03; menor soma dos tempos válidos; melhor classificação na Stage 04; persistindo igualdade absoluta, colocação compartilhada ou decisão da Direção de Prova."]],
  ["21", "Segmentos cronometrados", ["A Organização poderá criar rankings de subidas, sprints, setores especiais ou segmentos. Os tempos poderão ser calculados entre checkpoints ou pontos eletrônicos. Esses resultados são independentes da geral salvo divulgação expressa em contrário."]],
  ["22", "Penalidades", ["A Direção de Prova poderá aplicar advertência, penalização de tempo, perda de pontos, DNF, DSQ da etapa ou DSQ do evento, considerando gravidade, vantagem, reincidência, risco e intenção.", "Atalho com vantagem, vácuo deliberado em veículo, propulsão externa, E-Bike na Gravel Race, manipulação de GPS, fraude de identidade ou agressão poderão gerar desclassificação conforme a gravidade prevista no Regulamento."]],
  ["23", "Revisões e protestos", ["O pedido deve identificar a etapa, descrever objetivamente a ocorrência e apresentar evidências quando existentes. Prazo: até 30 minutos após a publicação do resultado provisório. A Central de Apuração poderá confirmar ou corrigir resultado, validar passagem, aplicar/remover penalização, DNF ou DSQ."]],
  ["24", "Segurança", ["Por segurança a Organização poderá interromper a prova, neutralizar trecho, alterar percurso ou horário, retirar participante, cancelar checkpoint, adiar largada ou cancelar etapa. A segurança prevalece sobre o interesse competitivo."]],
  ["25", "Meteorologia", ["Chuva, frio, calor, vento ou lama, isoladamente, não determinam cancelamento. Situações de risco como tempestades severas, raios, enchentes, deslizamentos, quedas de barreira, incêndios, interdições ou determinação de autoridade poderão provocar alteração ou suspensão."]],
  ["26", "Caso fortuito e força maior", ["Por circunstâncias inevitáveis, imprevisíveis ou que não possam ser adequadamente impedidas, a Organização poderá alterar percurso, distância, horários, cidade-base, largada, chegada, checkpoints ou programação. Alterações para preservar segurança não equivalem automaticamente ao cancelamento."]],
  ["27", "Adiamento ou cancelamento", ["No adiamento integral, a inscrição será mantida para a nova data, observados os direitos legais e condições comerciais. No cancelamento integral sem nova data haverá reembolso conforme legislação e contratação. Uma etapa poderá ser reduzida, neutralizada, interrompida ou cancelada, e a classificação será recalculada com base nas etapas homologadas."]],
  ["28", "Cancelamento voluntário da inscrição", ["Será respeitado o direito legal de arrependimento de 7 dias nas contratações online. Após esse prazo: até 120 dias antes — 80%; 119 a 60 dias — 60%; 59 a 30 dias — 40%; 29 a 8 dias — 20%; 7 dias ou menos — sem reembolso voluntário, ressalvados direitos legalmente obrigatórios."]],
  ["29", "Transferência de inscrição", ["Será permitida uma transferência de titularidade até 30 dias antes. No mesmo lote, a taxa é R$ 100. Em lote posterior, cobra-se a diferença entre o lote original e o lote vigente, com mínimo de R$ 100.", "A transferência somente se conclui após aprovação, pagamento, atualização cadastral e aceite do Regulamento pelo novo participante. Inscrição transferida não poderá ser novamente transferida, salvo autorização excepcional. Transferência informal é proibida."]],
  ["30", "Troca de modalidade", ["Permitida entre Gravel Race e Legends Experience até 15 dias antes, mediante disponibilidade, requisitos, aprovação e eventual diferença financeira. Não há transferência de pontos ou resultados entre modalidades."]],
  ["31", "Impedimento médico", ["Após os prazos de cancelamento, condição médica comprovada poderá ser submetida a análise extraordinária. A Organização poderá conceder crédito de até 50% do valor líquido para a edição seguinte, pessoal e intransferível, sem substituir direitos legais obrigatórios."]],
  ["32", "Responsabilidade do participante", ["O participante reconhece riscos inerentes ao ciclismo de longa distância e deve preparar-se fisicamente, usar equipamento adequado, navegar pelo percurso, respeitar o Regulamento e o trânsito, administrar alimentação e hidratação, reconhecer limites e comunicar riscos. O aceite não representa renúncia a direitos legalmente assegurados."]],
  ["33", "Tratamento de dados", ["A Organização poderá tratar dados necessários à inscrição, identificação, segurança, seguro, contato de emergência, Race Engine, resultados, rankings, atendimento e comunicação. Dados de saúde receberão tratamento compatível com sua natureza sensível."]],
  ["34", "Uso de imagem", ["Poderão ser produzidos registros fotográficos, audiovisuais e entrevistas. O tratamento e uso promocional observarão a autorização concedida no processo de inscrição e as normas aplicáveis."]],
  ["35", "Comunicação oficial", ["São canais oficiais o site Legends Bike Race, e-mail cadastrado, Legends Passport, Race Engine e demais canais indicados pela Organização. É responsabilidade do participante acompanhar as comunicações."]],
  ["36", "Briefing técnico", ["A Organização poderá realizar briefing obrigatório antes do evento ou das etapas. Informações de percurso, estrada, meteorologia, checkpoints, segurança, alterações e horários comunicadas oficialmente integram as regras da etapa."]],
  ["37", "Casos omissos", ["Situações não previstas serão analisadas pela Direção de Prova, observando segurança, equidade esportiva, fair play, legislação aplicável e interesse coletivo. Decisões com efeito sobre resultados ou classificação serão registradas."]],
  ["38", "Aceite", ["Ao concluir a inscrição, o participante declara que leu e compreendeu o Regulamento, teve acesso prévio, concorda com as regras esportivas e operacionais, fornecerá informações verdadeiras e apresentará a documentação obrigatória. A inscrição somente será apta após o cumprimento integral dos requisitos."]],
] as const;

export default function RegulamentoPage() {
  return (
    <main className="rulesPage">
      <style>{`
        .rulesPage{--paper:#f4f0db;--ink:#10120f;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:#0b0d0c;color:#f1ece3;min-height:100vh}.shell{width:min(1120px,calc(100% - 56px));margin:auto}.top{height:96px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.top img{height:68px}.top a{color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase}.hero{padding:90px 0 72px}.eyebrow{color:var(--copper);font:600 13px 'Barlow Condensed';letter-spacing:.2em;text-transform:uppercase}.hero h1{font:700 clamp(64px,8vw,112px) 'Barlow Condensed';line-height:.86;text-transform:uppercase;margin:18px 0}.hero p{max-width:820px;color:#aeb3aa;line-height:1.7}.meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.meta span{padding:10px 13px;border:1px solid var(--line);font:600 12px 'Barlow Condensed';letter-spacing:.09em;text-transform:uppercase}.navGrid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);margin-bottom:70px}.navGrid a{padding:13px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);color:#d7d2c8;font:600 12px 'Barlow Condensed';text-transform:uppercase}.rules{padding-bottom:100px}.rule{display:grid;grid-template-columns:90px 1fr;gap:32px;padding:34px 0;border-top:1px solid rgba(198,122,59,.22)}.num{font:700 36px 'Barlow Condensed';color:var(--copper)}.rule h2{font:700 38px 'Barlow Condensed';text-transform:uppercase;margin:0 0 14px}.rule p{color:#b3b7af;line-height:1.75;margin:8px 0}.notice{background:var(--paper);color:var(--ink);padding:55px 0}.notice h2{font:700 44px 'Barlow Condensed';text-transform:uppercase;margin:0 0 14px}.notice p{max-width:820px;line-height:1.7}.notice a{display:inline-block;margin-top:14px;background:var(--copper);color:#fff;padding:15px 20px;font:700 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.08em}@media(max-width:760px){.shell{width:calc(100% - 30px)}.navGrid{grid-template-columns:1fr 1fr}.rule{grid-template-columns:50px 1fr;gap:15px}.rule h2{font-size:30px}.top img{height:54px}}
      `}</style>
      <nav className="top shell"><a href="/">← Voltar ao site</a><img src="/legends-logo-official.png" alt="Legends Bike Race" /></nav>
      <header className="hero shell"><p className="eyebrow">Regulamento Oficial · Versão 1.1</p><h1>As regras<br />da travessia.</h1><p>29 de abril a 2 de maio de 2027 · Serra Gaúcha. Este regulamento deve ser lido antes da conclusão da inscrição e em conjunto com o Manual do Atleta e as comunicações oficiais.</p><div className="meta"><span>4 dias</span><span>370,3 km</span><span>6.302 m+</span><span>100 vagas</span></div></header>
      <nav className="navGrid shell" aria-label="Índice do regulamento">{sections.map(([n,title])=><a key={n} href={`#regra-${n}`}>{n}. {title}</a>)}</nav>
      <section className="rules shell">{sections.map(([n,title,paragraphs])=><article className="rule" id={`regra-${n}`} key={n}><div className="num">{n}</div><div><h2>{title}</h2>{paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div></article>)}</section>
      <section className="notice"><div className="shell"><p className="eyebrow">Antes da inscrição</p><h2>Documentação médica obrigatória.</h2><p>Atestado Médico válido e Declaração de Saúde oficial da Legends Bike Race são requisitos para a liberação do participante.</p><a href="/documentos-medicos">Ver documentação médica →</a></div></section>
    </main>
  );
}
