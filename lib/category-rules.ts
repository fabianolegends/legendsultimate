export type CategoryInput = {
  birthDate: string;
  eventDate: string;
  gender: string;
  modality: string;
};

export function ageOnDate(birthDate: string, eventDate: string) {
  const birthMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const eventMatch = eventDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!birthMatch || !eventMatch) return null;
  const [, birthYearText, birthMonthText, birthDayText] = birthMatch;
  const [, eventYearText, eventMonthText, eventDayText] = eventMatch;
  const birthYear = Number(birthYearText);
  const birthMonth = Number(birthMonthText);
  const birthDay = Number(birthDayText);
  const eventYear = Number(eventYearText);
  const eventMonth = Number(eventMonthText);
  const eventDay = Number(eventDayText);
  const validBirth =
    birthYear >= 1900 &&
    birthMonth >= 1 &&
    birthMonth <= 12 &&
    birthDay >= 1 &&
    birthDay <= 31;
  const validEvent =
    eventYear >= birthYear &&
    eventMonth >= 1 &&
    eventMonth <= 12 &&
    eventDay >= 1 &&
    eventDay <= 31;
  if (!validBirth || !validEvent) return null;
  const birthdayOccurred =
    eventMonth > birthMonth ||
    (eventMonth === birthMonth && eventDay >= birthDay);
  return eventYear - birthYear - (birthdayOccurred ? 0 : 1);
}

export function categoryForRegistration(input: CategoryInput) {
  const age = ageOnDate(input.birthDate, input.eventDate);
  if (age === null) return { age: null, category: null, error: "Data de nascimento inválida." };
  if (age < 18) return { age, category: null, error: "A inscrição online exige categoria com idade-base mínima de 18 anos." };
  if (input.modality === "experience") return { age, category: "Experience", error: null };
  if (input.gender === "male") {
    if (age <= 35) return { age, category: "Masculino Open 18–35", error: null };
    if (age <= 49) return { age, category: "Masculino Master 36–49", error: null };
    return { age, category: "Masculino Sênior 50+", error: null };
  }
  if (input.gender === "female") {
    return age <= 40
      ? { age, category: "Feminino 18–40", error: null }
      : { age, category: "Feminino 41+", error: null };
  }
  return { age, category: "Categoria geral 18+", error: null };
}
