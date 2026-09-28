import React from 'react';
import type { Candidate } from '../../types';
import { candidateReviewFlags } from '../../services/candidateReview';

export const ReviewWarnings: React.FC<{ candidate: Candidate; syncPending?: boolean }> = ({ candidate, syncPending }) => {
  const flags = candidateReviewFlags(candidate);
  return <>
    {candidate.documents.some(doc => doc.originalStorageStatus !== 'SYNCED') && <p role="status" className="p-2 text-xs bg-amber-50 text-amber-950 rounded">Some original files are not confirmed saved on the server. Keep this browser's data until synchronization succeeds. {candidate.documents.find(doc => doc.originalStorageError)?.originalStorageError}</p>}
    {syncPending && <p role="status" className="p-2 text-xs bg-blue-50 text-blue-900 rounded">Review saved on this device; server sync is pending. Refresh retries synchronization.</p>}
    {flags.length > 0 && <div role="alert" className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 shrink-0">
      <p className="font-bold mb-1">Evidence and age checks — review required</p>
      {flags.map(flag => <p key={flag} className="mt-1">{flag}</p>)}
      <p className="mt-2">Age is assessed as of today unless an assessment date is supplied. Confirm the applicable qualification date before making a recommendation.</p>
    </div>}
  </>;
};
