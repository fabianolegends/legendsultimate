"use client";

export default function PrintButton() {
  return <button className="print" type="button" onClick={() => window.print()}>Imprimir / salvar em PDF</button>;
}
