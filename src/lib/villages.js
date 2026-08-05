/**
 * Tournament villages — static list for team village dropdown.
 * Keep sorted alphabetically for admin/register UX.
 */
export const VILLAGES = [
  "Aaloo",
  "Aasal",
  "Baddoki",
  "Bedian",
  "Charar Pind",
  "Gaga",
  "Ghawind",
  "Hadyarah",
  "Harpalky",
  "Lakhoki",
  "Heir",
  "Jahman",
  "Kamaha",
  "Karbath",
  "Keerka",
  "Lidhar",
  "Mulkhoki",
  "Natha Singh",
  "Rampura",
  "Rasool Pura",
  "Rora",
  "Vidarah",
];

export function isValidVillage(value) {
  if (!value) return false;
  return VILLAGES.includes(String(value).trim());
}
