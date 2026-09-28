// Shared by intake, the API and reporting. These are the application's configured scopes.
export const ELECTIONS = [
  { id: 'elec_2027_general', name: '2027 General Elections', offices: ['President', 'Senator', 'House of Representatives Member'] },
  { id: 'elec_2027_gubernatorial', name: '2027 Gubernatorial Elections', offices: ['Governor'] },
  { id: 'elec_2027_state_assembly', name: '2027 State Assembly Elections', offices: ['State House of Assembly Member'] },
];

const legacyOffices: Record<string, string> = {
  president: 'President', presidential: 'President',
  governor: 'Governor', governorship: 'Governor',
  senate: 'Senator', senator: 'Senator',
  'house of representative': 'House of Representatives Member',
  'house of representatives': 'House of Representatives Member',
  'state house of assembly': 'State House of Assembly Member',
};

export interface ElectionRecord {
  electionId?: string;
  electionName: string;
  officeContested: string;
}

export function normalizeElection<T extends ElectionRecord>(record: T): T {
  const configured = ELECTIONS.find(e => e.id === record.electionId || e.name === record.electionName);
  if (configured) return { ...record, electionId: configured.id, electionName: configured.name };
  // Only repair the known intake bug (an office stored as an election).
  // Preserve real historical/unknown election names instead of guessing their year.
  const office = legacyOffices[(record.electionName || '').trim().toLowerCase()];
  const election = office && ELECTIONS.find(e => e.offices.includes(office));
  return election ? { ...record, electionId: election.id, electionName: election.name, officeContested: office } : record;
}

export function isValidElectionOffice(record: ElectionRecord): boolean {
  return ELECTIONS.some(e => e.id === record.electionId && e.name === record.electionName && e.offices.includes(record.officeContested));
}
