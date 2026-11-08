import type { Metadata } from "next";
import MedicalDocumentsPage from "../../MedicalDocumentsPage";

export const metadata: Metadata = {
  title: "Documentación médica para Legends 2027",
  description: "Consulta el certificado médico y la declaración de salud obligatorios para participar en Legends Bike Race 2027.",
  alternates: { canonical: "/es/documentos-medicos", languages: { "pt-BR": "/documentos-medicos", es: "/es/documentos-medicos", en: "/en/documentos-medicos", "x-default": "/documentos-medicos" } },
};

export default function MedicalDocumentsEsPage() {
  return <MedicalDocumentsPage locale="es" homeHref="/es" eyebrow="Documentación obligatoria · 2027" title={<>Documentación médica de Legends Bike Race 2027.<br />La salud antes de la salida.</>} description={<>Para habilitar al participante son obligatorios el <strong>Certificado Médico</strong> y la <strong>Declaración de Salud online</strong>.</>} backLabel="Volver al inicio" certificateTitle="Certificado Médico" certificateDescription="Documento oficial en formato A4 vertical, completado y firmado por el médico después de la evaluación del participante." certificateCta="IMPRIMIR" declarationTitle="Declaración de Salud" declarationDescription="Completada por el propio participante y enviada directamente al área restringida de la Organización." declarationCta="COMPLETAR ONLINE" onlineLabel="Completado online" conditionEyebrow="Condición de participación" conditionTitle="Ambos documentos son obligatorios." certificateRuleTitle="Certificado" certificateRuleText="Imprime el modelo A4, realiza la evaluación médica y conserva el documento debidamente firmado." declarationRuleTitle="Declaración online" declarationRuleText="Complétala en el sitio. Tras el envío, la información queda disponible para la Organización en el área administrativa." deadlineRuleTitle="Dentro del plazo" deadlineRuleText="El plazo operativo final para regularizar la documentación se informará antes del evento." privacyEyebrow="Privacidad" privacyTitle="Información sensible. Uso restringido." privacyText="La información de salud proporcionada por el participante no está disponible públicamente. El almacenamiento se asocia a la inscripción y el acceso se restringe al área de la Organización para fines de seguridad, atención médica y de emergencia, seguro y operación de la carrera." />;
}
