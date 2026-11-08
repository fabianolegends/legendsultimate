import type { Metadata } from "next";
import MedicalCertificate from "../../../MedicalCertificate";
export const metadata: Metadata = { title: "Certificado médico 2027", robots: { index: false, follow: false } };
export default function MedicalCertificateEsPage() { return <MedicalCertificate locale="es" />; }
