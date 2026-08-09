export const launchConfig = {
  eventName: "Legends Bike Race 2027",
  eventDateLabel: "29 de abril a 2 de maio de 2027",
  eventDateShort: "29 ABR — 02 MAI 2027",
  location: "Serra Gaúcha · Brasil",
  spots: 100,
  registrationUrl: process.env.NEXT_PUBLIC_WINDFIT_REGISTRATION_URL || "",
  registrationOpen: process.env.NEXT_PUBLIC_REGISTRATION_OPEN === "true",
  priorityAccess: process.env.NEXT_PUBLIC_PRIORITY_ACCESS === "true",
  activeLotIndex: 0,
  lots: [
    { name: "Lote 01", price: "R$ 1.199", period: "18/08 a 20/09/2026" },
    { name: "Lote 02", price: "R$ 1.399", period: "21/09 a 10/12/2026" },
    { name: "Lote 03", price: "R$ 1.599", period: "11/12/2026 a 20/03/2027" },
  ],
  premiumKitPrice: "R$ 399",
  premiumKitItems: ["Camisa de ciclismo", "Colete de ciclismo", "2 pares de meias"],
  cyclingJerseyOnlyPrice: "R$ 189",
} as const;

export function getRegistrationLabel() {
  if (launchConfig.registrationOpen) return "Inscreva-se";
  if (launchConfig.priorityAccess) return "Acesso prioritário";
  return "Inscrições em breve";
}

export function getRegistrationHref() {
  return launchConfig.registrationOpen && launchConfig.registrationUrl
    ? launchConfig.registrationUrl
    : "/inscricoes";
}
