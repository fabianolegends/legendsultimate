const cities = [
  ["Canela", "Natureza, arquitetura, gastronomia e acesso a paisagens emblemáticas da Serra Gaúcha.", "https://canela.com.br/"],
  ["São Francisco de Paula", "Campos de altitude, araucárias, estradas remotas e uma atmosfera marcada pela aventura.", "https://www.saofranciscodepaula.rs.gov.br/portal/turismo"],
  ["Gramado", "Hotelaria, gastronomia, cultura e uma das experiências turísticas mais reconhecidas do Brasil.", "https://www.gramadoinesquecivel.tur.br/"],
  ["Nova Petrópolis", "Herança germânica, paisagem rural, jardins e o cenário final da travessia.", "https://turismo.novapetropolis.rs.gov.br/"],
];

export default function Destino() {
  return <main className="destinationPage">
    <style>{`
      .destinationPage{--paper:#f4f0db;--ink:#0b0d0c;--copper:#c67a3b;--line:rgba(198,122,59,.34);background:var(--ink);color:#f1ece3;min-height:100vh}
      .wrap{width:min(1240px,calc(100% - 80px));margin:auto}.top{height:100px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(241,236,227,.14)}
      .logo{height:72px;width:auto}.back{font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.15em;color:var(--copper)}
      .hero{min-height:650px;display:flex;align-items:end;padding:100px 0;background:linear-gradient(0deg,rgba(6,8,7,.95),rgba(6,8,7,.1)),linear-gradient(120deg,#1a211b,#59624f 50%,#111411)}
      .kicker{font:600 14px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.22em;color:var(--copper)}h1,h2{font-family:'Barlow Condensed';text-transform:uppercase;line-height:.88;margin:20px 0}
      h1{font-size:clamp(70px,9vw,135px);max-width:1040px}h2{font-size:clamp(48px,6vw,82px)}.lead{max-width:820px;font-size:20px;line-height:1.75;color:#d4d8d2}
      .story{background:var(--paper);color:var(--ink);padding:110px 0}.storyGrid{display:grid;grid-template-columns:1.1fr .9fr;gap:90px}.story p{font-size:18px;line-height:1.85;color:#50544e}
      .cities{padding:110px 0}.cityGrid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.city{padding:30px 24px;min-height:300px;border-right:1px solid var(--line);display:flex;flex-direction:column;justify-content:space-between}.city:last-child{border:0}.city h3{font:700 38px 'Barlow Condensed';text-transform:uppercase;line-height:.95;margin:0}.city p{color:#a2a8a0;line-height:1.65}.city span{color:var(--copper);font:600 13px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.12em}
      .close{background:var(--paper);color:var(--ink);padding:100px 0}.close blockquote{font:700 clamp(50px,7vw,100px) 'Barlow Condensed';text-transform:uppercase;line-height:.9;margin:0;max-width:1100px}.close em{font-style:normal;color:var(--copper)}
      @media(max-width:800px){.wrap{width:calc(100% - 32px)}.top{height:82px}.logo{height:58px}.hero{min-height:520px;padding:70px 0}.storyGrid{grid-template-columns:1fr;gap:20px}.story,.cities{padding:80px 0}.cityGrid{grid-template-columns:1fr}.city{min-height:220px;border-right:0;border-bottom:1px solid var(--line)}.city:last-child{border-bottom:0}}
    `}</style>
    <nav className="top wrap"><a href="/"><img className="logo" src="/legends-logo-official.png" alt="Legends" /></a><a className="back" href="/">← Voltar à Home</a></nav>
    <section className="hero"><div className="wrap"><p className="kicker">Destino Serra Gaúcha</p><h1>Um Brasil que poucos no mundo conhecem.</h1><p className="lead">A Serra Gaúcha não é apenas o cenário da Legends. Ela é parte essencial da experiência: estradas rurais, araucárias, vales, cultura, gastronomia e cidades preparadas para receber viajantes.</p></div></section>
    <section className="story"><div className="wrap storyGrid"><div><p className="kicker">Por que a Serra</p><h2>A bicicleta revela o território por dentro.</h2></div><div><p>A Legends atravessa estradas secundárias e comunidades rurais, conectando cidades turísticas a paisagens que normalmente ficam fora dos roteiros tradicionais.</p><p>Para atletas brasileiros, é uma nova forma de conhecer a região. Para estrangeiros, é a oportunidade de descobrir um Brasil surpreendente, seguro, estruturado e profundamente conectado à cultura europeia do sul do país.</p></div></div></section>
    <section className="cities"><div className="wrap"><p className="kicker">Quatro cidades</p><h2>Quatro capítulos da mesma jornada.</h2><div className="cityGrid">{cities.map(([name,text,href])=><a className="city" href={href} target="_blank" rel="noreferrer" key={name}><span>Conheça o destino ↗</span><div><h3>{name}</h3><p>{text}</p></div></a>)}</div></div></section>
    <section className="close"><div className="wrap"><blockquote>Não é apenas um percurso de gravel. <em>É uma forma diferente de conhecer o Brasil.</em></blockquote></div></section>
  </main>;
}