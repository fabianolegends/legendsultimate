export const WINDFIT_REGISTRATION_URL = "https://event.windfit.app/legends-ultimate-stage-race";

export const launchConfig = {
  eventName: "Legends Bike Race 2027",
  eventDateLabel: "29 de abril a 2 de maio de 2027",
  eventDateShort: "29 ABR — 02 MAI 2027",
  location: "Serra Gaúcha · Brasil",
  spots: 150,
  registrationUrl: WINDFIT_REGISTRATION_URL,
  registrationOpen: true,
  priorityAccess: process.env.NEXT_PUBLIC_PRIORITY_ACCESS === "true",
  activeLotIndex: 0,
  journeys: {
    ultimate: {
      id: "ultimate",
      name: "Legends Ultimate",
      dateLabel: "29 de abril a 2 de maio de 2027",
      dateShort: "29 ABR — 02 MAI 2027",
      spots: 100,
      stageNumbers: [1, 2, 3, 4],
      days: 4,
      distance: "370,3 km",
      ascent: "6.302 m+",
      cities: "Canela · São Francisco de Paula · Gramado · Nova Petrópolis",
      awardPlaces: 5,
      lots: [
        { name: "Lote 01", price: "R$ 999", period: "18/08 a 20/09/2026" },
        { name: "Lote 02", price: "R$ 1.199", period: "21/09 a 10/12/2026" },
        { name: "Lote 03", price: "R$ 1.399", period: "11/12/2026 a 20/03/2027" },
      ],
    },
    short: {
      id: "short",
      name: "Legends Short",
      dateLabel: "1º e 2 de maio de 2027",
      dateShort: "01 — 02 MAI 2027",
      spots: 50,
      stageNumbers: [3, 4],
      days: 2,
      distance: "169,3 km",
      ascent: "3.098 m+",
      cities: "Gramado · Nova Petrópolis · Canela",
      awardPlaces: 3,
      lots: [
        { name: "Lote 01", price: "R$ 699", period: "18/08 a 20/09/2026" },
        { name: "Lote 02", price: "R$ 799", period: "21/09 a 10/12/2026" },
        { name: "Lote 03", price: "R$ 899", period: "11/12/2026 a 20/03/2027" },
      ],
    },
  },
  premiumKitPrice: "R$ 399",
  premiumKitItems: ["Camisa de ciclismo", "Colete de ciclismo", "2 pares de meias"],
  cyclingJerseyOnlyPrice: "R$ 189",
} as const;

export type JourneyFormat = keyof typeof launchConfig.journeys;

export function getJourneyFormat(value?: string): JourneyFormat {
  return value === "short" ? "short" : "ultimate";
}

export function getRegistrationLabel() {
  return "Me inscrever";
}

export function getRegistrationHref(format?: JourneyFormat) {
  void format;
  return WINDFIT_REGISTRATION_URL;
}
