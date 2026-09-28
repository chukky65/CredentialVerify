import { ELECTIONS, normalizeElection } from '../../server/src/elections';
import { NIGERIA_JURISDICTIONS } from '../data/jurisdictions';
import type { Candidate, VerificationCase } from '../types';

export function electionOptions(records: Array<{ electionName: string; officeContested: string; electionId?: string }>) {
  return Array.from(new Set([...ELECTIONS.map(e => e.name), ...records.map(r => normalizeElection(r).electionName)]))
    .filter(Boolean);
}

export function matchesJurisdiction(actual: string, selected: string): boolean {
  if (selected === 'ALL' || actual === selected) return true;
  const state = NIGERIA_JURISDICTIONS.find(s => s.state === selected);
  return !!state && (state.senatorialDistricts.includes(actual) || state.lgas.some(lga => actual === `${lga} LGA, ${state.state}`));
}

export function scopeRecords(candidates: Candidate[], cases: VerificationCase[], election: string, jurisdiction: string) {
  const matches = (record: { electionName: string; jurisdiction: string; officeContested: string }) =>
    (election === 'ALL' || normalizeElection(record).electionName === election) && matchesJurisdiction(record.jurisdiction, jurisdiction);
  const byId = new Map(candidates.map(c => [c.id, c]));
  return {
    candidates: candidates.filter(matches),
    // The candidate's registration is the source of truth for its case's election and office.
    cases: cases.filter(c => matches(byId.get(c.candidateId) || c)),
  };
}
