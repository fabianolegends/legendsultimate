const steps = [
  ["01", "Antes do evento", "O atleta confirma sua inscrição, escolhe uma hospedagem indicada, prepara a bicicleta e recebe o GPX oficial uma semana antes da largada."],
  ["02", "Na largada", "A bagagem de 50 litros é entregue à organização. O atleta larga com GPS, equipamentos obrigatórios, hidratação e alimentação para o dia."],
  ["03", "No percurso", "A navegação é feita pelo arquivo GPX. Cada etapa terá dois checkpoints com hidratação e controle por passaporte carimbado."],
  ["04", "Na chegada", "O atleta conclui a etapa em uma nova cidade, recebe sua bagagem e utiliza Bike Wash e suporte mecânico básico."],
  ["05", "À noite", "Hospedagem, recuperação, jantar opcional e briefing técnico da etapa seguinte."],
];

const rules = [
  ["Autonavegação", "GPS com navegação é obrigatório. O equipamento deve oferecer autonomia mínima recomendada de 15 horas."],
  ["Erro de percurso", "O participante deve retornar ao ponto em que deixou o trajeto oficial e retomar o GPX. Cortes podem gerar desclassificação."],
  ["Bagagem", "A organização transporta exclusivamente a bag oficial de 50 litros entre as cidades-base."],
  ["Apoio externo", "Não será permitido apoio externo individual. A assistência será centralizada pelos veículos oficiais."],
  ["Gravel Race", "Modalidade competitiva, com tempo registrado, pontuação por etapa, categorias e premiação final."],
  ["Legends Experience", "Modalidade de turismo para MTB e E-bike, sem classificação, tempo competitivo ou premiação."],
];

export default function ComoFunciona() {
  return <main className="infoPage">
    <style>{`
      .infoPage{--paper:#f4f0db;--ink:#0b0d0c;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:var(--ink);color:#f1ece3;min-height:100vh}
      .wrap{width:min(1240px,calc(100% - 80px));margin:auto}.top{height:100px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
      .logo{height:72px;width:auto}.back{font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.15em;color:var(--copper)}
      .hero{padding:100px 0 90px}.kicker{font:600 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.22em;color:var(--copper)}
      h1,h2{font-family:'Barlow Condensed';text-transform:uppercase;line-height:.88;margin:20px 0}h1{font-size:clamp(70px,9vw,135px);max-width:980px}h2{font-size:clamp(48px,6vw,82px)}
      .lead{max-width:760px;font-size:19px;line-height:1.75;color:#aeb4ab}.paper{background:var(--paper);color:var(--ink);padding:110px 0}.timeline{border-top:1px solid #bdb4a7}
      .step{display:grid;grid-template-columns:90px 260px 1fr;gap:32px;padding:28px 0;border-bottom:1px solid #c9c0b3}.step b{color:var(--copper);font:700 22px 'Barlow Condensed'}.step h3{font:700 28px 'Barlow Condensed';text-transform:uppercase;margin:0}.step p{margin:0;color:#555950;line-height:1.7}
      .rules{padding:110px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}.card{background:#101310;padding:32px}.card h3{font:700 28px 'Barlow Condensed';text-transform:uppercase;color:var(--copper);margin:0 0 16px}.card p{color:#a4aaa1;line-height:1.7;margin:0}
      .cta{background:var(--paper);color:var(--ink);padding:95px 0;text-align:center}.cta a{display:inline-block;background:var(--copper);padding:18px 28px;font:700 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.12em;margin-top:24px}
      @media(max-width:760px){.wrap{width:calc(100% - 32px)}.top{height:82px}.logo{height:58px}.hero{padding:70px 0}.paper,.rules{padding:80px 0}.step{grid-template-columns:48px 1fr;gap:18px}.step p{grid-column:2}.grid{grid-template-columns:1fr}}
    `}</style>
    <nav className="top wrap"><a href="/"><img className="logo" src="/legends-logo-official.png" alt="Legends" /></a><a className="back" href="/">← Voltar à Home</a></nav>
    <section className="hero wrap"><p className="kicker">Como funciona</p><h1>Quatro dias. Quatro cidades. Uma única travessia.</h1><p className="lead">A Legends combina autonomia no percurso com uma operação que simplifica hospedagem, bagagem, manutenção e segurança. Você se concentra na bicicleta; a organização conecta cada capítulo da jornada.</p></section>
    <section className="paper"><div className="wrap"><p className="kicker">A rotina da jornada</p><h2>Do GPX ao próximo capítulo.</h2><div className="timeline">{steps.map(([n,t,d])=><div className="step" key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></div>)}</div></div></section>
    <section className="rules"><div className="wrap"><p className="kicker">Regras essenciais</p><h2>Autonomia com clareza.</h2><div className="grid">{rules.map(([t,d])=><article className="card" key={t}><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>
    <section className="cta"><div className="wrap"><h2>Antes de aceitar o desafio, conheça cada etapa.</h2><a href="/#percurso">Ver as quatro etapas →</a></div></section>
  </main>;
}