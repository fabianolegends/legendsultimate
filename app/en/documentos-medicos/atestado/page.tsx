import type { Metadata } from "next";
import MedicalCertificate from "../../../MedicalCertificate";
export const metadata: Metadata = { title: "Medical Certificate 2027", robots: { index: false, follow: false } };
export default function MedicalCertificateEnPage() { return <MedicalCertificate locale="en" />; }
