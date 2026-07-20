export type CategoryInput = {
  birthDate: string;
  eventDate: string;
  gender: string;
  modality: string;
};

export function ageOnDate(birthDate: string, eventDate: string) {
  const birthYear = Number(birthDate.slice(0, 4));
  const eventYear = Number(eventDate.slice(0, 4));
  if (!Number.isInteger(birthYear) || !Number.isInteger(eventYear) || birthYear < 1900 || birthYear > eventYear) return null;
  return eventYear - birthYear;
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
