import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ELECTIONS, normalizeElection, isValidElectionOffice } from '../../server/src/elections';
import { electionOptions, scopeRecords } from './electionScope';
import { reconcileCases } from './reconcileCases';
import { SOURCE_CONNECTORS } from '../data/sourceConnectors';
import type { Candidate, VerificationCase } from '../types';

const candidate = (id: string, election: number, jurisdiction: string) => ({
  id, electionId: ELECTIONS[election].id, electionName: ELECTIONS[election].name,
  officeContested: ELECTIONS[election].offices[0], jurisdiction, documents: [], dateOfBirth: '1980-01-01', fullName: 'Test Candidate',
} as Candidate);
const pendingCase = (id: string, c: Candidate, reference = `INTAKE-${c.id}`) => ({
  id, candidateId: c.id, caseReference: reference, electionName: c.electionName,
  officeContested: c.officeContested, jurisdiction: c.jurisdiction, workflowStatus: 'PENDING',
} as VerificationCase);

test('all offices map to a valid configured election; legacy office names are repaired', () => {
  for (const election of ELECTIONS) for (const office of election.offices) {
    assert.ok(isValidElectionOffice({ electionId: election.id, electionName: election.name, officeContested: office }));
  }
  for (const [name, index] of [['President', 0], ['Presidential', 0], ['Governorship', 1], ['Senate', 0], ['House of Representative', 0], ['State House of Assembly', 2]] as const) {
    const repaired = normalizeElection({ electionId: 'elec_2026_nat', electionName: name, officeContested: 'President' });
    assert.equal(repaired.electionId, ELECTIONS[index].id);
    assert.ok(isValidElectionOffice(repaired));
  }
  assert.equal(isValidElectionOffice({ electionId: ELECTIONS[0].id, electionName: ELECTIONS[0].name, officeContested: 'Governor' }), false);
});

test('unknown historical elections remain intact and selectable', () => {
  const historic = { electionId: 'old', electionName: '2023 General Elections', officeContested: 'President' };
  assert.deepEqual(normalizeElection(historic), historic);
  assert.ok(electionOptions([historic]).includes(historic.electionName));
});

test('all, each election, combined jurisdiction and empty scopes filter candidates and cases together', () => {
  const candidates = [candidate('a', 0, 'National (All States)'), candidate('b', 1, 'Lagos State'), candidate('c', 2, 'Lagos State')];
  const cases = candidates.map(c => pendingCase(`case_${c.id}`, c));
  // A stale case label must follow the registration relationship.
  cases[0].electionName = 'President';
  assert.equal(scopeRecords(candidates, cases, 'ALL', 'ALL').cases.length, 3);
  for (const election of ELECTIONS) {
    const scoped = scopeRecords(candidates, cases, election.name, 'ALL');
    assert.equal(scoped.candidates.length, 1);
    assert.equal(scoped.cases.filter(c => c.workflowStatus === 'PENDING').length, 1);
  }
  const lagos = scopeRecords(candidates, cases, 'ALL', 'Lagos State');
  assert.equal(lagos.candidates.length, 2);
  assert.equal(lagos.cases.length, 2);
  assert.deepEqual(scopeRecords(candidates, cases, ELECTIONS[0].name, 'Lagos State'), { candidates: [], cases: [] });
});

test('state scopes include their senatorial districts without including other states', () => {
  const c = candidate('senator', 0, 'Lagos Central Senatorial District');
  assert.equal(scopeRecords([c], [pendingCase('s', c)], 'ALL', 'Lagos State').cases.length, 1);
  assert.equal(scopeRecords([c], [pendingCase('s', c)], 'ALL', 'Kano State').cases.length, 0);
});

test('two registrations with browser/server copies yield two cases, preserving review and separate references', () => {
  const a = candidate('a', 0, 'National (All States)');
  const b = candidate('b', 1, 'Lagos State');
  const local = [pendingCase('case_a', a), pendingCase('case_b', b)];
  local[0].workflowStatus = 'NEEDS_REVIEW';
  const remote = [pendingCase('uuid-a', a), pendingCase('uuid-b', b)];
  const result = reconcileCases([...local, ...remote], remote);
  assert.equal(result.cases.length, 2);
  assert.equal(result.cases[0].workflowStatus, 'NEEDS_REVIEW');
  assert.equal(result.aliases.get('case_a'), 'uuid-a');
  assert.equal(reconcileCases(result.cases, remote).cases.length, 2);
  assert.equal(reconcileCases(result.cases, [pendingCase('uuid-extra', a, 'APPEAL')]).cases.length, 3);
});

test('both connector views share exactly the six requested unconfigured sources', () => {
  assert.deepEqual(SOURCE_CONNECTORS.map(s => s.acronym), ['NUC', 'NPC', 'NIMC', 'INEC', 'NYSC', 'WAEC']);
  assert.ok(SOURCE_CONNECTORS.every(s => s.status === 'NOT_CONFIGURED' && s.totalQueriesToday === 0));
});

test('service uses returned server case and repairs stored duplicates with linked evidence', async () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  const c = candidate('existing', 0, 'National (All States)');
  const local = pendingCase('case_old', c);
  const remote = pendingCase('server-old', c);
  storage.set('credential_verify_candidates', JSON.stringify([c]));
  storage.set('credential_verify_cases', JSON.stringify([local, remote]));
  storage.set('credential_verify_source_checks', JSON.stringify([{ id: 'evidence', caseId: local.id }]));
  storage.set('credential_verify_discrepancies', JSON.stringify([{ id: 'discrepancy', caseId: local.id }]));
  storage.set('credential_verify_rfis', JSON.stringify([{ id: 'rfi', caseId: local.id }]));
  const { apiClient } = await import('./apiClient');
  const originalCreate = apiClient.createCandidate;
  const originalGet = apiClient.getCases;
  const { verificationService } = await import('./verificationService');
  try {
    apiClient.getCases = async () => [remote];
    assert.equal((await verificationService.getCases()).length, 1);
    for (const key of ['source_checks', 'discrepancies', 'rfis']) {
      assert.equal(JSON.parse(storage.get(`credential_verify_${key}`)!)[0].caseId, remote.id);
    }
    const created = { ...candidate('new', 1, 'Lagos State'), referenceCode: 'TEST-123' };
    const returnedCase = pendingCase('server-new', created, 'CASE-123');
    apiClient.createCandidate = async () => ({ ...created, cases: [returnedCase] });
    await verificationService.createCandidate(created);
    apiClient.getCases = async () => [remote, returnedCase];
    const cases = await verificationService.getCases();
    assert.equal(cases.length, 2);
    assert.equal(cases.filter(item => item.candidateId === created.id)[0].id, returnedCase.id);
  } finally {
    apiClient.createCandidate = originalCreate;
    apiClient.getCases = originalGet;
  }
});
