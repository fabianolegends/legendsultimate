import type { Metadata } from "next";
import PrintButton from "../PrintButton";

export const metadata: Metadata = { title: "Declaração de Saúde | Legends Bike Race 2027", robots: { index: false, follow: false } };

const questions = [
  "Doença cardíaca, arritmia, insuficiência cardíaca, infarto ou outra condição cardiovascular?",
  "Dor ou pressão no peito durante esforço físico?",
  "Desmaio, perda de consciência, tontura intensa ou palpitações importantes durante exercício?",
  "Hipertensão arterial ou uso de medicação para controle da pressão?",
  "Asma, bronquite, doença pulmonar ou outra condição respiratória relevante?",
  "Diabetes, hipoglicemia ou outra condição metabólica que exija cuidados durante esforço prolongado?",
  "Epilepsia, convulsões ou outra condição neurológica relevante?",
  "Lesão ou limitação ortopédica/musculoesquelética que possa interferir no ciclismo de longa duração?",
  "Alergia grave a medicamentos, alimentos, picadas de insetos ou outras substâncias?",
  "Uso contínuo de medicamentos?",
  "Cirurgia, internação ou tratamento médico relevante nos últimos 12 meses?",
  "Outra condição de saúde que a equipe médica do evento deva conhecer?",
];

export default function DeclaracaoSaudePage() {
  return <main className="formPage"><style>{`
    .formPage{--copper:#b47049;max-width:900px;margin:0 auto;padding:28px 38px 48px;color:#222;background:#fff;font-family:Arial,sans-serif}.brand{text-align:center;border-bottom:2px solid var(--copper);padding-bottom:11px;margin-bottom:18px}.brand img{width:130px}.brand h1{font:700 25px 'Barlow Condensed',Arial;text-transform:uppercase;margin:8px 0 3px}.brand p{margin:0;color:var(--copper);font-weight:700;font-size:11px}.intro{text-align:center;color:#666;font-size:11px}.section{margin-top:17px}.section h2{font:700 16px 'Barlow Condensed',Arial;text-transform:uppercase;color:var(--copper);margin:0 0 7px}.field{display:grid;grid-template-columns:180px 1fr;border:1px solid #ddd;border-bottom:0;min-height:32px;font-size:12px}.field:last-child{border-bottom:1px solid #ddd}.field strong{background:#f1e9de;padding:8px}.field span{padding:8px}.q{display:grid;grid-template-columns:145px 1fr;border:1px solid #ddd;border-bottom:0;font-size:11px;min-height:28px}.q:last-child{border-bottom:1px solid #ddd}.q b{padding:7px;color:var(--copper)}.q span{padding:7px}.declaration{font-size:11.5px;line-height:1.45}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:35px}.sig{border-top:1px solid #333;padding-top:6px;font-size:11px}.note{font-size:9.5px;color:#666;line-height:1.4;margin-top:25px}.print{display:block;margin:20px auto 0;background:var(--copper);color:#fff;border:0;padding:11px 16px;width:max-content;font-weight:700;text-transform:uppercase;font-size:11px;cursor:pointer}@media print{.print{display:none}.formPage{padding:0;max-width:none}@page{margin:12mm}}
  `}</style>
  <div className="brand"><img src="/legends-logo-official.png" alt="Legends Bike Race" /><h1>Declaração de Saúde do Participante</h1><p>DOCUMENTO OBRIGATÓRIO · PREENCHIMENTO PELO ATLETA</p></div>
  <p className="intro">Informações de uso restrito para segurança, atendimento de emergência, seguro e operação médica do evento.</p>
  <section className="section"><h2>Identificação</h2><div className="field"><strong>Nome completo</strong><span /></div><div className="field"><strong>CPF / Passaporte</strong><span /></div><div className="field"><strong>Data de nascimento</strong><span /></div><div className="field"><strong>Tipo sanguíneo</strong><span /></div><div className="field"><strong>Telefone</strong><span /></div><div className="field"><strong>Contato de emergência</strong><span>Tel.:</span></div></section>
  <section className="section"><h2>Histórico de saúde — marque SIM ou NÃO</h2>{questions.map(q=><div className="q" key={q}><b>☐ SIM &nbsp;&nbsp; ☐ NÃO</b><span>{q}</span></div>)}</section>
  <section className="section"><h2>Informações complementares</h2><div className="field"><strong>Medicamentos em uso</strong><span /></div><div className="field"><strong>Alergias</strong><span /></div><div className="field"><strong>Condições / observações</strong><span /></div></section>
  <section className="section"><h2>Declaração do participante</h2><p className="declaration">Declaro que as informações prestadas são verdadeiras, completas e atualizadas. Comprometo-me a informar qualquer alteração relevante de meu estado de saúde ocorrida até o início do evento. <strong>Reconheço que esta declaração não substitui a avaliação médica obrigatória.</strong></p><p className="declaration">Autorizo o tratamento restrito destas informações para finalidades relacionadas à segurança, atendimento médico e de emergência, seguro e operação da prova, observadas as normas aplicáveis de proteção de dados.</p></section>
  <div className="signatures"><div className="sig">Assinatura do participante</div><div className="sig">Data: ____ / ____ / ________</div></div><div className="signatures"><div>Cidade: __________________________</div><div>UF / País: _______________________</div></div>
  <p className="note"><strong>IMPORTANTE:</strong> se alguma resposta for “SIM”, detalhe a condição no campo de observações e informe o médico responsável pela avaliação. A omissão de informação relevante poderá comprometer o atendimento em emergência.</p>
  <PrintButton />
  </main>;
}
