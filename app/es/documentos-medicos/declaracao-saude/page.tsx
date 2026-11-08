import type { Metadata } from "next";
import HealthDeclarationForm from "../../../HealthDeclarationForm";
export const metadata: Metadata = { title: "Declaración de Salud 2027", robots: { index: false, follow: false } };
export default function HealthDeclarationEsPage() { return <HealthDeclarationForm locale="es" />; }
