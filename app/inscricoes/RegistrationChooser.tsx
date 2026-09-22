"use client";

import { useState } from "react";
import { getRegistrationHref, launchConfig, type JourneyFormat } from "../lib/launch";
import styles from "../experience.module.css";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RegistrationChooser({ format, initialMode = "race" }: { format: JourneyFormat; initialMode?: "race" | "experience" }) {
  const [mode, setMode] = useState<"race" | "experience">(initialMode);
  const j = launchConfig.journeys[format];
  const lot = j.lots[launchConfig.activeLotIndex];
  const base = Number(lot.price.replace(/[^0-9,]/g, "").replace(",", "."));
  const fee = Math.round(base * 10) / 100;
  return <section className={`${styles.experience} ${styles.chooser}`} id="jornadas">
    <div className={styles.container}>
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Sua inscrição começa aqui</p><h1>Escolha sua<br /><em>travessia.</em></h1></div><p>Compare os dias, escolha como participar e confira o resumo antes de continuar na WindFit.</p></div>
      <div className={styles.checkoutGrid}><div>
        <h2 className={styles.stepTitle}>1. Quantos dias você quer pedalar?</h2>
        <div className={styles.choiceGrid}>{Object.values(launchConfig.journeys).map(option=><a key={option.id} className={`${styles.choice} ${option.id===format ? styles.selected : ""}`} href={`/inscricoes?formato=${option.id}&modalidade=${mode}#jornadas`} aria-current={option.id===format ? "true" : undefined}><span>{option.id===format ? "Selecionado" : "Selecionar"} · {option.days} dias</span><h3>{option.id==="ultimate"?"Ultimate":"Short"}</h3><p>{option.dateShort}</p><p>{option.distance} · {option.ascent}</p><strong>{option.lots[launchConfig.activeLotIndex].price}</strong><small>+ taxa da plataforma · {option.lots[launchConfig.activeLotIndex].name}</small></a>)}</div>
        <fieldset className={styles.modeField}><legend className={styles.stepTitle}>2. Como você quer participar?</legend>
          <label className={`${styles.radioCard} ${mode==="race"?styles.selected:""}`}><input type="radio" name="participacao" value="race" checked={mode==="race"} onChange={()=>setMode("race")} /><span><strong>Competir · Gravel Race</strong><small>Gravel e Cyclocross sem assistência elétrica. Com classificação e premiação.</small></span></label>
          <label className={`${styles.radioCard} ${mode==="experience"?styles.selected:""}`}><input type="radio" name="participacao" value="experience" checked={mode==="experience"} onChange={()=>setMode("experience")} /><span><strong>Sem ranking · Legends Experience</strong><small>Gravel, MTB e E-bike de pedal assistido. A mesma estrutura, no seu ritmo.</small></span></label>
        </fieldset>
        <div className={styles.essentials}><strong>Antes de continuar</strong><p>Hospedagem, refeições e transporte pessoal são por sua conta. Navegação por GPS, preparação física e documentação médica são obrigatórias.</p><a href="#informacoes">Consultar inclusões, regras e documentos ↓</a></div>
      </div>
      <aside className={styles.orderSummary} aria-label="Resumo da escolha">
        <p className={styles.eyebrow}>3. Confira sua escolha</p>
        <div aria-live="polite" aria-atomic="true"><h2>{j.name}</h2><p>{mode==="race"?"Gravel Race · competição":"Legends Experience · sem ranking"}</p><p className={styles.summaryDate}>{j.dateLabel}</p><p>{j.days} dias · {j.stageNumbers.length} etapas · {j.distance}</p>
        <dl className={styles.bill}><div><dt>{lot.name}</dt><dd>{lot.price}</dd></div><div><dt>Taxa estimada (10%)</dt><dd>{money(fee)}</dd></div><div><dt>Total estimado</dt><dd>{money(base+fee)}</dd></div></dl></div>
        <p className={styles.feeNote}>Referência da taxa exibida pela WindFit. O valor final, eventuais descontos e adicionais serão confirmados na plataforma.</p>
        <div className={styles.handoff}><strong>Na WindFit, selecione:</strong><p>{mode==="race"?`LEGENDS ${format==="short"?"Short":"Ultimate"} - ${j.days} Dias`:`EXPEDITION MTB / E-BIKE - ${j.days} Dias`}</p><small>A plataforma abre na página do evento. Confirme essa opção no campo “Desafio” antes de se inscrever.{mode==="experience"?" A modalidade sem ranking aparece lá com o nome Expedition.":""}</small></div>
        <a className={styles.primary} href={getRegistrationHref(format)}>Continuar na WindFit ↗</a>
        <p className={styles.feeNote}>Cadastro e pagamento realizados na plataforma oficial.</p>
      </aside></div>
    </div>
  </section>;
}
