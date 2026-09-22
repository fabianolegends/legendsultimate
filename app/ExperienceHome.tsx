import Image from "next/image";
import ExperienceHeader from "./ExperienceHeader";
import { launchConfig } from "./lib/launch";
import styles from "./experience.module.css";

const stages = [
  ["01", "29 ABR", "Canela", "São Francisco de Paula", "111,9 km", "1.684 m+"],
  ["02", "30 ABR", "São Francisco de Paula", "Gramado", "89,1 km", "1.520 m+"],
  ["03", "01 MAI", "Gramado", "Nova Petrópolis", "99,3 km", "1.522 m+"],
  ["04", "02 MAI", "Nova Petrópolis", "Canela", "70,0 km", "1.576 m+"],
];
const questions = [
  ["Preciso ser atleta profissional?", "Não. Mas é necessário estar treinado para longas distâncias em dias consecutivos, com subidas e navegação por GPS. A Short também é um desafio de resistência: são 169,3 km em dois dias."],
  ["Posso participar com MTB ou E-bike?", "Sim, na Legends Experience, sem ranking. A Gravel Race é competitiva e aceita Gravel e Cyclocross sem assistência elétrica. E-bikes devem ser de pedal assistido, conforme o regulamento."],
  ["Preciso navegar pelo GPS?", "Sim. Você recebe os arquivos GPX oficiais e é responsável por seguir a rota, conhecer seu dispositivo e manter a bateria. A sinalização física é complementar."],
  ["Hospedagem e alimentação estão incluídas?", "Não. Hospedagem, refeições e transporte pessoal são por conta do participante. A organização transporta a bag oficial de 50 litros entre as cidades-base."],
  ["Como faço minha inscrição?", "Escolha o formato e a modalidade na página de inscrições. Confira o resumo e continue na WindFit, plataforma oficial, onde você seleciona o desafio, faz o cadastro e conclui o pagamento."],
];

export default function ExperienceHome() {
  return <div className={styles.experience}>
    <ExperienceHeader />
    <main id="conteudo">
      <section className={styles.hero} aria-labelledby="experience-title">
        <Image src="/hero-gravel-race-curva.jpg" alt="Vista aérea de um ciclista em uma curva de estrada cercada por vegetação" fill priority sizes="100vw" className={styles.heroImage} />
        <div className={styles.heroShade} />
        <div className={`${styles.container} ${styles.heroContent}`}>
          <p className={styles.eyebrow}>Serra Gaúcha · 29 abril — 02 maio 2027</p>
          <h1 id="experience-title"><span className={styles.heroName}>Legends Gravel Race</span><br /><em>Competição ou experiência</em><br />a escolha é sua</h1>
          <p className={styles.heroLead}>Escolha o formato ideal para você ou conheça a prova antes de decidir.</p>
          <a href="#formatos" className={styles.primary}>Escolher minha prova <span aria-hidden="true">↗</span></a>
          <a href="/a-prova" className={styles.heroSecondary}>Conheça a prova <span aria-hidden="true">→</span></a>
        </div>
        <div className={`${styles.container} ${styles.heroFoot}`}><span>ULTIMATE · 4 ETAPAS / SHORT · 2 ETAPAS</span><span>Classificação e premiação independentes por formato.</span></div>
      </section>

      <section className={`${styles.section} ${styles.paper}`} id="formatos" aria-labelledby="formats-title">
        <div className={styles.container}>
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>01 / Escolha seus dias</p><h2 id="formats-title">Uma travessia.<br /><em>Dois formatos.</em></h2></div><p>Escolha quanto da jornada quer viver. Nos dois formatos, você pode competir ou pedalar sem ranking.</p></div>
          <div className={styles.formatGrid}>{Object.values(launchConfig.journeys).map(j => <article className={styles.formatCard} key={j.id}>
            <div className={styles.cardTop}><span>{j.id === "ultimate" ? "A jornada completa" : "As duas etapas finais"}</span><b>{j.days} dias</b></div>
            <h3>{j.id === "ultimate" ? "Ultimate" : "Short"}</h3>
            <p className={styles.date}>{j.dateShort}</p>
            <p>{j.id === "ultimate" ? "De Canela a Canela, passando por todos os capítulos da travessia." : "De Gramado a Canela, pelas etapas 3 e 4 da mesma travessia."}</p>
            <dl className={styles.stats}><div><dt>Distância</dt><dd>{j.distance}</dd></div><div><dt>Subida acumulada</dt><dd>{j.ascent}</dd></div><div><dt>Etapas</dt><dd>{j.stageNumbers.length}</dd></div></dl>
            <div className={styles.priceRow}><div><span>{j.lots[launchConfig.activeLotIndex].name} · inscrição</span><strong>{j.lots[launchConfig.activeLotIndex].price}</strong><small>+ taxa da plataforma</small></div><a className={styles.darkButton} href={`/inscricoes?formato=${j.id}#jornadas`}>Escolher {j.id === "ultimate" ? "Ultimate" : "Short"} <span aria-hidden="true">→</span></a></div>
          </article>)}</div>
          <p className={styles.sectionNote}>Lote atual: {launchConfig.journeys.ultimate.lots[launchConfig.activeLotIndex].period}. Confira valores, taxas e condições antes de concluir a inscrição.</p>
        </div>
      </section>

      <section className={styles.section} id="modalidades"><div className={styles.container}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>02 / Escolha como participar</p><h2>Sua prova.<br /><em>Seu objetivo.</em></h2></div><p>Os mesmos caminhos e a mesma estrutura de apoio. Você escolhe se quer disputar um resultado ou completar seu desafio pessoal.</p></div>
        <div className={styles.modeGrid}><article className={styles.raceFeatured}><span className={styles.eyebrow}>Modalidade competitiva</span><h3>Gravel Race</h3><p>Dispute cada etapa e some pontos na classificação geral do seu formato.</p><ul className={styles.raceFacts}><li>Tempo registrado e classificação por categoria</li><li>Ultimate: 4 etapas · troféus do 1º ao 5º</li><li>Short: 2 etapas · troféus do 1º ao 3º</li></ul><strong>Gravel e Cyclocross</strong><small>Sem assistência elétrica · premiação por categoria</small><a href="/inscricoes" className={styles.primary}>Quero competir ↗</a></article><article><span className={styles.eyebrow}>Para viver a travessia</span><h3>Legends Experience</h3><p>Desafio pessoal, sem ranking ou premiação competitiva.</p><strong>Gravel, MTB e E-bike</strong><small>E-bikes de pedal assistido, conforme regulamento</small></article></div>
        <p className={styles.sectionNote}>As duas modalidades estão disponíveis na Ultimate e na Short. Navegação por GPS e preparação física são necessárias em ambas.</p>
      </div></section>

      <section className={`${styles.section} ${styles.routes}`} id="percurso"><div className={styles.container}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>O caminho faz parte da história</p><h2>Quatro etapas.<br /><em>Novos horizontes.</em></h2></div><a href="/percursos" className={styles.textLink}>Explorar os percursos →</a></div>
        <div className={styles.stageGrid}>{stages.map(([number,date,start,end,distance,ascent],i)=><a href={`/percursos/stage-${i+1}`} className={styles.stage} key={number}><span className={styles.stageNumber}>{number}</span><span className={styles.stageLabel}>{date} · {i<2?"Ultimate":"Ultimate + Short"}</span><h3>{start}<span>→ {end}</span></h3><p>{distance} <span>· {ascent}</span></p><span className={styles.textLink}>Ver etapa ↗</span></a>)}</div>
      </div></section>

      <section className={`${styles.section} ${styles.paper}`} id="incluido"><div className={styles.container}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>03 / Saiba o que esperar</p><h2>Aventura com<br /><em>estrutura.</em></h2></div><p>O essencial para planejar sua participação, com clareza sobre o que está na inscrição e o que você precisa organizar.</p></div>
        <div className={styles.includedGrid}><article><h3>Na sua inscrição</h3><ul><li>Kit padrão: camiseta, cap, bag de 50 L e placa</li><li>Transporte da bag entre as cidades-base</li><li>GPX, checkpoints e hidratação</li><li>SPOT, equipe de apoio, segurança e resgate</li><li>Bike Wash e mecânica básica</li></ul></article><article><h3>Por sua conta</h3><ul><li>Hospedagem e refeições</li><li>Transporte pessoal e da bicicleta</li><li>GPS e equipamentos obrigatórios</li><li>Peças, serviços extras e kit premium opcional</li><li>Documentação médica exigida</li></ul></article></div>
        <div className={styles.actions}><a href="/inscricoes#informacoes" className={styles.darkButton}>Ver a lista completa →</a><a href="/documentos-medicos" className={styles.textLink}>Documentos necessários ↗</a></div>
      </div></section>

      <section className={`${styles.section} ${styles.faq}`} id="duvidas"><div className={styles.container}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Antes de decidir</p><h2>Dúvidas<br /><em>essenciais.</em></h2></div><a href="/faq#perguntas" className={styles.textLink}>Ver todas as perguntas →</a></div>
        {questions.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </div></section>
      <section className={styles.final}><div className={styles.container}><p className={styles.eyebrow}>Legends Bike Race 2027</p><h2>A próxima história<br /><em>é sua.</em></h2><a href="/inscricoes" className={styles.primary}>Escolher formato e me inscrever ↗</a><p><a href="https://wa.me/5554996329164">Precisa de ajuda? Fale com a organização →</a></p></div></section>
      <aside className={styles.partners}><div className={styles.container}><span>Bike oficial · Danda Bike + Specialized</span><a href="https://dandabikeshop.com.br/bicicletas/estrada-gravel" target="_blank" rel="noreferrer">Conheça a Specialized Diverge ↗</a></div></aside>
    </main>
  </div>;
}
