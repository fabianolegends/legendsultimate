"use client";

import { Bed, Bicycle, CalendarDots, CurrencyDollar, FileText, MapTrifold, Minus, Package, Plus, Trophy, TShirt, UsersThree } from "@phosphor-icons/react";

type IconKind = "values" | "modalities" | "categories" | "awards" | "stages" | "schedule" | "lodging" | "included" | "premium" | "documents";

const icons = {
  values: CurrencyDollar,
  modalities: Bicycle,
  categories: UsersThree,
  awards: Trophy,
  stages: MapTrifold,
  schedule: CalendarDots,
  lodging: Bed,
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
