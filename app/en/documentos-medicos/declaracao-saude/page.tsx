import type { Metadata } from "next";
import HealthDeclarationForm from "../../../HealthDeclarationForm";
export const metadata: Metadata = { title: "Health Declaration 2027", robots: { index: false, follow: false } };
export default function HealthDeclarationEnPage() { return <HealthDeclarationForm locale="en" />; }
