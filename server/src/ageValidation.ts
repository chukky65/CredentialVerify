// INEC FAQs (2023), qualifications for elective offices:
// https://www.inecnigeria.org/wp-content/uploads/2023/02/FAQ-Inner.pdf
// These are review flags, never automatic eligibility determinations.
export const MINIMUM_AGES: Record<string, number> = {
  President: 35, 'Vice-President': 35, 'Vice President': 35,
  Governor: 35, 'Deputy Governor': 35, Senator: 35,
  'House of Representatives Member': 25, 'State House of Assembly Member': 25,
};

export function parseBirthDate(value: string): string | null {
  if (typeof value !== 'string') return null;
  let year: number, month: number, day: number;
  const monthNumber = (name: string) => {
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const lower = name.toLowerCase();
    return months.findIndex(m => lower === m || lower === m.slice(0,3) || (m === 'september' && lower === 'sept')) + 1;
  };
  const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const numeric = value.trim().match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  const written = value.trim().match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)[,\s]+(\d{4})$/i);
  const monthFirst = value.trim().match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})$/i);
  if (iso) [, year, month, day] = iso.map(Number);
  else if (numeric) { day = +numeric[1]; month = +numeric[2]; year = +numeric[3]; }
  else if (written) {
    day = +written[1]; year = +written[3];
    month = monthNumber(written[2]);
  } else if (monthFirst) {
    day = +monthFirst[2]; year = +monthFirst[3];
    month = monthNumber(monthFirst[1]);
  } else return null;
  if (year! < 1000 || month! < 1 || month! > 12 || day! < 1) return null;
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  if (date.getUTCFullYear() !== year! || date.getUTCMonth() !== month! - 1 || date.getUTCDate() !== day!) return null;
  return date.toISOString().slice(0, 10);
}

export function assessAge(dob: string, office: string, asOf = new Date().toISOString().slice(0, 10)) {
  const normalized = parseBirthDate(dob);
  const minimum = MINIMUM_AGES[office];
  const flags: string[] = [];
  if (!normalized || normalized > asOf) {
    flags.push(!normalized ? 'Date of birth is missing or invalid.' : 'Date of birth is in the future.');
    return { age: null, minimum, asOf, flags, invalid: true };
  }
  const age = +asOf.slice(0, 4) - +normalized.slice(0, 4) - (asOf.slice(5) < normalized.slice(5) ? 1 : 0);
  if (age > 120) flags.push(`Date of birth implies age ${age}; verify the original document for a possible date entry or extraction error. The 120-year threshold is a data-quality check, not a legal maximum.`);
  if (minimum && age < minimum) flags.push(`Age ${age} is below the ${minimum}-year requirement for ${office} as of ${asOf}. Review against the applicable qualification date; no automatic disqualification.`);
  if (!minimum) flags.push(`No age rule is configured for ${office}; review manually.`);
  return { age, minimum, asOf, flags, invalid: false };
}
