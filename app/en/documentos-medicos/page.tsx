import type { Metadata } from "next";
import MedicalDocumentsPage from "../../MedicalDocumentsPage";

export const metadata: Metadata = {
  title: "Medical documents for Legends 2027",
  description: "Read and prepare the mandatory medical certificate and health declaration for Legends Bike Race 2027.",
  alternates: { canonical: "/en/documentos-medicos", languages: { "pt-BR": "/documentos-medicos", es: "/es/documentos-medicos", en: "/en/documentos-medicos", "x-default": "/documentos-medicos" } },
};

export default function MedicalDocumentsEnPage() {
  return <MedicalDocumentsPage locale="en" homeHref="/en" eyebrow="Mandatory documents · 2027" title={<>Legends Bike Race 2027 medical documents.<br />Health before the start.</>} description={<>A <strong>Medical Certificate</strong> and the online <strong>Health Declaration</strong> are required to clear a participant.</>} backLabel="Back to home" certificateTitle="Medical Certificate" certificateDescription="Official A4 portrait document, completed and signed by a physician after the participant's assessment." certificateCta="PRINT" declarationTitle="Health Declaration" declarationDescription="Completed by the participant and submitted directly to the Organization's restricted area." declarationCta="COMPLETE ONLINE" onlineLabel="Online form" conditionEyebrow="Condition of participation" conditionTitle="Both documents are mandatory." certificateRuleTitle="Certificate" certificateRuleText="Print the A4 template, complete the medical assessment and keep the document properly signed." declarationRuleTitle="Online declaration" declarationRuleText="Complete it on the website. After submission, the information is available to the Organization in the administrative area." deadlineRuleTitle="Within the deadline" deadlineRuleText="The final operational deadline for regularizing documentation will be announced before the event." privacyEyebrow="Privacy" privacyTitle="Sensitive information. Restricted use." privacyText="Health information provided by the participant is not publicly available. Storage is tied to registration and access is restricted to the Organization for safety, medical and emergency care, insurance and race operation purposes." />;
}
