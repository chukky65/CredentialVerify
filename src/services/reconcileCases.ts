import type { VerificationCase } from '../types';

// Only collapse the known browser/server duplicate: same candidate AND intake reference.
// A candidate's separate case references must remain separate cases.
export function reconcileCases(local: VerificationCase[], remote: VerificationCase[]) {
  const cases = [...local];
  const aliases = new Map<string, string>();
  for (const incoming of remote) {
    const index = cases.findIndex(c => c.id === incoming.id ||
      (c.id.startsWith('case_') && c.candidateId === incoming.candidateId && c.caseReference === incoming.caseReference));
    if (index < 0) {
      cases.push(incoming);
    } else {
      const existing = cases[index];
      if (existing.id !== incoming.id) aliases.set(existing.id, incoming.id);
      // Review actions currently live in the browser. Preserve those and use the server identity.
      cases[index] = { ...incoming, ...existing, id: incoming.id };
    }
  }
  // Older storage may already contain both copies from a previous refresh.
  const unique = cases.filter(c => !aliases.has(c.id)).filter((c, i, all) => all.findIndex(other => other.id === c.id) === i);
  return { cases: unique, aliases };
}
