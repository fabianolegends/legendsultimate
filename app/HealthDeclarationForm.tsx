"use client";

import { FormEvent, useState } from "react";

type Locale = "es" | "en";
type FormState = Record<string, string | boolean>;

const copy = {
  es: {
    home: "Volver al inicio", documents: "Documentos médicos", eyebrow: "Declaración de Salud · Online", title: <>Completa y<br />envía a la organización.</>, intro: <>La declaración se vincula a tu inscripción y se guarda en el área restringida de la Organización. Ten a mano el <strong>número de atleta / número de inscripción</strong> recibido después de completar tu inscripción.</>, identityNotice: "Cómo validamos tu identidad:", identityText: "indica el número recibido en la inscripción y el mismo e-mail usado en el registro. Ambos datos deben coincidir con la inscripción registrada.", identification: "Identificación de la inscripción", athleteNumber: "Número de atleta / inscripción", athletePlaceholder: "Ej.: número informado en la confirmación", email: "E-mail de inscripción", blood: "Tipo sanguíneo", notInformed: "No informado", emergencyName: "Contacto de emergencia", emergencyPhone: "Teléfono de emergencia", health: "Historial de salud", extra: "Información complementaria", medicines: "Medicamentos en uso", medicinesPlaceholder: "Indica nombre, dosis y frecuencia cuando corresponda.", allergies: "Alergias", notes: "Condiciones / observaciones", authorization: "Declaración y autorización", consent: "Declaro que la información proporcionada es verdadera, completa y actualizada. Autorizo el tratamiento restringido de estos datos para seguridad, atención médica y de emergencia, seguro y operación de Legends Bike Race, reconociendo que esta declaración no sustituye el Certificado Médico obligatorio.", privacy: "Los datos de salud se clasifican como sensibles y no están disponibles públicamente. El acceso se restringe al área administrativa de la Organización.", sending: "ENVIANDO...", sent: "DECLARACIÓN ENVIADA", submit: "ENVIAR DECLARACIÓN A LA ORGANIZACIÓN →", yes: "Sí", no: "No", error: "No fue posible enviar la declaración.", success: (name: string, number: string) => `Declaración enviada correctamente para ${name}. Número de atleta: ${number}.`,
    questions: [
      ["cardiovascular", "¿Tienes o has tenido enfermedad cardíaca, arritmia, insuficiencia cardíaca, infarto u otra condición cardiovascular?"],
      ["chest_pain", "¿Has tenido dolor o presión en el pecho durante esfuerzo físico?"],
      ["syncope_palpitations", "¿Has tenido desmayo, pérdida de conciencia, mareo intenso o palpitaciones importantes durante el ejercicio?"],
      ["hypertension", "¿Tienes hipertensión arterial o utilizas medicación para controlar la presión?"],
      ["respiratory", "¿Tienes asma, bronquitis, enfermedad pulmonar u otra condición respiratoria relevante?"],
      ["metabolic", "¿Tienes diabetes, historial de hipoglucemia u otra condición metabólica que requiera cuidado durante esfuerzo prolongado?"],
      ["neurological", "¿Tienes epilepsia, historial de convulsiones u otra condición neurológica relevante?"],
      ["orthopedic", "¿Tienes lesión o limitación ortopédica/musculoesquelética que pueda interferir con el ciclismo de larga distancia?"],
      ["severe_allergy", "¿Tienes alergia grave a medicamentos, alimentos, picaduras de insectos u otras sustancias?"],
      ["continuous_medication", "¿Tomas medicamentos de uso continuo?"],
      ["recent_surgery", "¿Te sometiste a cirugía, internación hospitalaria o tratamiento médico relevante en los últimos 12 meses?"],
      ["other_condition", "¿Existe alguna otra condición de salud que el equipo médico del evento deba conocer?"],
    ],
  },
  en: {
    home: "Back to home", documents: "Medical documents", eyebrow: "Health Declaration · Online", title: <>Complete and<br />send to the organization.</>, intro: <>This declaration is linked to your registration and stored in the Organization's restricted area. Have the <strong>athlete number / registration number</strong> received after registration ready.</>, identityNotice: "How we validate your identity:", identityText: "enter the number received at registration and the same email address used in your registration. Both details must match the registered entry.", identification: "Registration identification", athleteNumber: "Athlete / registration number", athletePlaceholder: "E.g.: the number in your confirmation", email: "Registration email", blood: "Blood type", notInformed: "Not provided", emergencyName: "Emergency contact", emergencyPhone: "Emergency phone", health: "Health history", extra: "Additional information", medicines: "Medication in use", medicinesPlaceholder: "State name, dose and frequency where applicable.", allergies: "Allergies", notes: "Conditions / notes", authorization: "Declaration and authorization", consent: "I declare that the information provided is truthful, complete and current. I authorize the restricted processing of this data for safety, medical and emergency care, insurance and Legends Bike Race operations, acknowledging that this declaration does not replace the mandatory Medical Certificate.", privacy: "Health data is classified as sensitive and is not publicly available. Access is restricted to the Organization's administrative area.", sending: "SENDING...", sent: "DECLARATION SENT", submit: "SEND DECLARATION TO THE ORGANIZATION →", yes: "Yes", no: "No", error: "The declaration could not be sent.", success: (name: string, number: string) => `Declaration successfully submitted for ${name}. Athlete number: ${number}.`,
    questions: [
      ["cardiovascular", "Do you have or have you had heart disease, arrhythmia, heart failure, heart attack or another cardiovascular condition?"],
      ["chest_pain", "Have you experienced chest pain or pressure during physical exertion?"],
      ["syncope_palpitations", "Have you experienced fainting, loss of consciousness, severe dizziness or significant palpitations during exercise?"],
      ["hypertension", "Do you have high blood pressure or take medication to control blood pressure?"],
      ["respiratory", "Do you have asthma, bronchitis, lung disease or another relevant respiratory condition?"],
      ["metabolic", "Do you have diabetes, a history of hypoglycaemia or another metabolic condition requiring care during prolonged exertion?"],
      ["neurological", "Do you have epilepsy, a history of seizures or another relevant neurological condition?"],
      ["orthopedic", "Do you have an orthopaedic/musculoskeletal injury or limitation that may interfere with long-distance cycling?"],
      ["severe_allergy", "Do you have a severe allergy to medication, food, insect stings or other substances?"],
      ["continuous_medication", "Do you take ongoing medication?"],
      ["recent_surgery", "Have you undergone surgery, hospitalization or relevant medical treatment in the past 12 months?"],
      ["other_condition", "Is there any other health condition the event medical team should know about?"],
    ],
  },
} as const;

export default function HealthDeclarationForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [form, setForm] = useState<FormState>({ consent: false });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const base = `/${locale}/documentos-medicos`;

  function setField(name: string, value: string | boolean) { setForm((current) => ({ ...current, [name]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(""); setSuccess(false);
    try {
      const response = await fetch("/api/public/health-declaration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? t.error);
      setSuccess(true); setMessage(t.success(payload.athlete_name, payload.athlete_number));
    } catch (error) { setMessage(error instanceof Error ? error.message : t.error); } finally { setSaving(false); }
  }

  return <main className="healthFormPage" lang={locale}><style>{`
    .healthFormPage{--copper:#c67a3b;background:#0b0d0c;color:#f1ece3;min-height:100vh;padding-bottom:80px}.healthFormPage .shell{width:min(900px,calc(100% - 32px));margin:auto}.healthFormPage .top{min-height:92px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;border-bottom:1px solid rgba(198,122,59,.32)}.healthFormPage .top img{height:62px}.healthFormPage .topLinks{display:flex;align-items:center;gap:22px;flex-wrap:wrap}.healthFormPage .top a{color:var(--copper);font:700 12px 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase}.healthFormPage .hero{padding:70px 0 38px}.healthFormPage .eyebrow{color:var(--copper);font:700 12px 'Barlow Condensed';letter-spacing:.18em;text-transform:uppercase}.healthFormPage .hero h1{font:700 clamp(48px,7vw,82px) 'Barlow Condensed';line-height:.9;text-transform:uppercase;margin:12px 0}.healthFormPage .hero p{max-width:760px;color:#aeb3aa;line-height:1.65}.healthFormPage .notice{border:1px solid rgba(198,122,59,.45);background:#151814;padding:18px;margin:0 0 26px;color:#d9d7d0;line-height:1.55}.healthFormPage .notice strong{color:var(--copper)}.healthFormPage form{display:grid;gap:22px}.healthFormPage .block{border:1px solid rgba(255,255,255,.11);padding:26px;background:#111411}.healthFormPage .block h2{font:700 28px 'Barlow Condensed';text-transform:uppercase;margin:0 0 18px;color:#f1ece3}.healthFormPage .grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.healthFormPage .wide{grid-column:1/-1}.healthFormPage label{display:grid;gap:7px;color:#c7cbc4;font-size:12px;font-weight:700}.healthFormPage input,.healthFormPage select,.healthFormPage textarea{width:100%;box-sizing:border-box;background:#0c0f0c;border:1px solid #41463e;color:#fff;padding:13px 14px;font:500 14px Arial}.healthFormPage textarea{resize:vertical}.healthFormPage .q{display:grid;grid-template-columns:1fr auto;gap:18px;padding:15px 0;border-bottom:1px solid rgba(255,255,255,.1);align-items:center}.healthFormPage .q:last-child{border:0}.healthFormPage .q p{margin:0;color:#c9ccc6;line-height:1.45}.healthFormPage .yesno{display:flex;gap:8px}.healthFormPage .yesno label{display:flex;align-items:center;gap:5px;border:1px solid #3b4039;padding:8px 10px;cursor:pointer}.healthFormPage .yesno input,.healthFormPage .consent input{width:auto}.healthFormPage .consent{display:flex;align-items:flex-start;gap:10px;line-height:1.5}.healthFormPage .consent input{margin-top:3px}.healthFormPage .submit{border:0;background:var(--copper);color:white;padding:17px 24px;font:700 14px 'Barlow Condensed';letter-spacing:.09em;text-transform:uppercase;cursor:pointer}.healthFormPage .submit:disabled{opacity:.55}.healthFormPage .result{padding:18px;border:1px solid #6b4b2e;background:#1d1710;color:#f0c8a4}.healthFormPage .result.ok{border-color:#3b6647;background:#101b13;color:#a9d8b5}.healthFormPage .privacy{font-size:11px;color:#8e948b;line-height:1.55}@media(max-width:700px){.healthFormPage .grid{grid-template-columns:1fr}.healthFormPage .wide{grid-column:auto}.healthFormPage .q{grid-template-columns:1fr}.healthFormPage .hero{padding-top:48px}.healthFormPage .block{padding:20px}.healthFormPage .topLinks{gap:12px}.healthFormPage .top a{font-size:10px}}
  `}</style>
  <nav className="top shell"><div className="topLinks"><a href={locale === "es" ? "/es" : "/en"}>← {t.home}</a><a href={base}>{t.documents}</a></div><img src="/legends-logo-official.png" alt="Legends Bike Race" /></nav>
  <header className="hero shell"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p>{t.intro}</p></header>
  <div className="shell"><div className="notice"><strong>{t.identityNotice}</strong> {t.identityText}</div>
  <form onSubmit={submit}>
    <section className="block"><h2>{t.identification}</h2><div className="grid"><label>{t.athleteNumber}<input required value={String(form.athlete_number ?? "")} onChange={(e)=>setField("athlete_number",e.target.value)} placeholder={t.athletePlaceholder} /></label><label>{t.email}<input required type="email" value={String(form.email ?? "")} onChange={(e)=>setField("email",e.target.value)} /></label><label>{t.blood}<select value={String(form.blood_type ?? "")} onChange={(e)=>setField("blood_type",e.target.value)}><option value="">{t.notInformed}</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((value)=><option key={value}>{value}</option>)}</select></label><label>{t.emergencyName}<input required value={String(form.emergency_contact_name ?? "")} onChange={(e)=>setField("emergency_contact_name",e.target.value)} /></label><label className="wide">{t.emergencyPhone}<input required value={String(form.emergency_contact_phone ?? "")} onChange={(e)=>setField("emergency_contact_phone",e.target.value)} /></label></div></section>
    <section className="block"><h2>{t.health}</h2>{t.questions.map(([key, question])=><div className="q" key={key}><p>{question}</p><div className="yesno"><label><input required type="radio" name={key} checked={form[key] === true} onChange={()=>setField(key,true)} /> {t.yes}</label><label><input required type="radio" name={key} checked={form[key] === false} onChange={()=>setField(key,false)} /> {t.no}</label></div></div>)}</section>
    <section className="block"><h2>{t.extra}</h2><div className="grid"><label className="wide">{t.medicines}<textarea rows={3} value={String(form.medications ?? "")} onChange={(e)=>setField("medications",e.target.value)} placeholder={t.medicinesPlaceholder} /></label><label className="wide">{t.allergies}<textarea rows={3} value={String(form.allergies ?? "")} onChange={(e)=>setField("allergies",e.target.value)} /></label><label className="wide">{t.notes}<textarea rows={4} value={String(form.health_notes ?? "")} onChange={(e)=>setField("health_notes",e.target.value)} /></label></div></section>
    <section className="block"><h2>{t.authorization}</h2><label className="consent"><input required type="checkbox" checked={form.consent === true} onChange={(e)=>setField("consent",e.target.checked)} /><span>{t.consent}</span></label><p className="privacy">{t.privacy}</p></section>
    {message && <div className={`result${success ? " ok" : ""}`}>{message}</div>}<button className="submit" disabled={saving || success}>{saving ? t.sending : success ? t.sent : t.submit}</button>
  </form></div>
  </main>;
}
