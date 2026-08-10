"use client";

import { Bicycle, CurrencyDollar, FileText, Minus, Package, Plus, TShirt } from "@phosphor-icons/react";

type IconKind = "values" | "modalities" | "included" | "premium" | "documents";

const icons = {
  values: CurrencyDollar,
  modalities: Bicycle,
  included: Package,
  premium: TShirt,
  documents: FileText,
} as const;

export function AccordionLeadIcon({ kind }: { kind: IconKind }) {
  const Icon = icons[kind];
  return <Icon aria-hidden="true" />;
}

export function AccordionToggleIcons() {
  return <><Plus className="plusIcon" aria-hidden="true" /><Minus className="minusIcon" aria-hidden="true" /></>;
}
