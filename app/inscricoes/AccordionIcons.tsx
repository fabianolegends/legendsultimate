"use client";

import { Bicycle, CalendarDots, CurrencyDollar, FileText, MapTrifold, Minus, Package, Plus, TShirt, UsersThree } from "@phosphor-icons/react";

type IconKind = "values" | "modalities" | "categories" | "stages" | "schedule" | "included" | "premium" | "documents";

const icons = {
  values: CurrencyDollar,
  modalities: Bicycle,
  categories: UsersThree,
  stages: MapTrifold,
  schedule: CalendarDots,
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
