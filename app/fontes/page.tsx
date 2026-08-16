import Link from "next/link";
import {
  Big_Shoulders_Display,
  Oxanium,
  Russo_One,
  Saira_Condensed,
  Teko,
} from "next/font/google";

const bigShoulders = Big_Shoulders_Display({ subsets: ["latin"], weight: ["700", "800"] });
const teko = Teko({ subsets: ["latin"], weight: ["600", "700"] });
const saira = Saira_Condensed({ subsets: ["latin"], weight: ["700", "800"] });
const oxanium = Oxanium({ subsets: ["latin"], weight: ["600", "700"] });
const russo = Russo_One({ subsets: ["latin"], weight: "400" });

const options = [
  {
    number: "01",
    name: "Big Shoulders Display",
    className: bigShoulders.className,
    note: "Alta, angular e premium. Mantém ligação com a identidade atual.",
    recommended: true,
  },
  {
    number: "02",
    name: "Teko",
    className: teko.className,
    note: "Mais esportiva e veloz, com presença de competição.",
  },
  {
    number: "03",
    name: "Saira Condensed",
    className: saira.className,
    note: "Técnica, robusta e muito legível em telas pequenas.",
  },
  {
    number: "04",
    name: "Oxanium",
    className: oxanium.className,
    note: "Geométrica e tecnológica, aproxima os nomes do Race Engine.",
  },
  {
    number: "05",
    name: "Russo One",
    className: russo.className,
    note: "Larga, forte e impactante, com visual de produto independente.",
  },
];

export const metadata = { title: "Comparativo de fontes" };

export default function FontesPage() {
  return (
    <main className="fontPreview">
      <div className="fontShell">
        <header>
          <div>
            <p>ESTUDO TIPOGRÁFICO · LEGENDS BIKE RACE</p>
            <h1>Escolha a identidade das jornadas.</h1>
          </div>
          <Link href="/inscricoes#jornadas">← Voltar às inscrições</Link>
        </header>

        <section className="fontList" aria-label="Cinco opções de fontes">
          {options.map((option) => (
            <article key={option.number}>
              <div className="fontMeta">
                <span>{option.number}</span>
                <div>
                  <strong>{option.name}</strong>
                  <small>{option.note}</small>
                </div>
                {option.recommended ? <b>RECOMENDADA</b> : null}
              </div>
              <div className={`${option.className} fontNames`}>
                <span>LEGENDS</span> <em>ULTIMATE</em>
                <i>LEGENDS</i> <strong>SHORT</strong>
              </div>
            </article>
          ))}
        </section>
      </div>

      <style>{`
        .fontPreview{min-height:100vh;background:#0b0e0c;color:#f2ede5;padding:58px 0 90px}
        .fontShell{width:min(1420px,calc(100% - 72px));margin:auto}
        .fontPreview header{display:flex;justify-content:space-between;gap:40px;align-items:end;padding-bottom:30px;border-bottom:1px solid rgba(198,122,59,.42)}
        .fontPreview header p{margin:0 0 13px;color:#c67a3b;font:700 12px 'Barlow Condensed';letter-spacing:.22em}
        .fontPreview h1{max-width:830px;margin:0;font:700 clamp(44px,5.4vw,76px)/.92 'Barlow Condensed';text-transform:uppercase}
        .fontPreview header a{color:#d7d1c8;font:700 12px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase}
        .fontList{display:grid;margin-top:32px;border-top:1px solid rgba(255,255,255,.12)}
        .fontList article{display:grid;grid-template-columns:330px minmax(0,1fr);gap:46px;align-items:center;min-height:188px;padding:27px 20px;border-bottom:1px solid rgba(255,255,255,.12);background:linear-gradient(90deg,rgba(198,122,59,.06),transparent 38%)}
        .fontMeta{display:grid;grid-template-columns:34px 1fr;gap:16px;align-items:start;position:relative}
        .fontMeta>span{color:#c67a3b;font:700 15px 'Barlow Condensed'}
        .fontMeta strong,.fontMeta small{display:block}.fontMeta strong{font:700 18px 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase}.fontMeta small{margin-top:8px;color:#90968e;font-size:12px;line-height:1.5}
        .fontMeta b{grid-column:2;width:max-content;margin-top:8px;padding:5px 8px;border:1px solid #c67a3b;color:#c67a3b;font:700 9px 'Barlow Condensed';letter-spacing:.13em}
        .fontNames{display:grid;grid-template-columns:auto 1fr;column-gap:.2em;align-items:baseline;font-size:clamp(48px,5.2vw,82px);line-height:.8;text-transform:uppercase;letter-spacing:.01em}
        .fontNames span,.fontNames i{color:#6f756e;font-size:.38em;font-style:normal;letter-spacing:.14em}.fontNames em,.fontNames strong{color:#f2ede5;font-style:normal;font-weight:inherit}.fontNames strong{color:#c67a3b}.fontNames i{margin-top:.42em}
        @media(max-width:760px){.fontPreview{padding:34px 0 60px}.fontShell{width:calc(100% - 36px)}.fontPreview header{display:block}.fontPreview header a{display:inline-block;margin-top:22px}.fontList article{grid-template-columns:1fr;gap:22px;min-height:0;padding:25px 4px}.fontNames{font-size:clamp(42px,15vw,62px);line-height:.84}.fontMeta small{max-width:300px}}
      `}</style>
    </main>
  );
}
