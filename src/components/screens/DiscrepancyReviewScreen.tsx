import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { candidateReviewFlags } from '../../services/candidateReview';
import { StatusBadge } from '../common/StatusBadge';
import { IssueRFIModal } from './IssueRFIModal';
import { verificationService } from '../../services/verificationService';

export const DiscrepancyReviewScreen: React.FC = () => {
  const { cases, candidates, navigateTo, currentUser, refreshData, addToast } = useApp();
  const { caseId } = useParams();
  const [selectedId, setSelectedId] = useState('');
  const [rfiOpen, setRfiOpen] = useState(false);
  const entries = cases.filter(item => !caseId || item.id === caseId).flatMap(item => {
    const candidate = candidates.find(c => c.id === item.candidateId);
    if (!candidate) return [];
    return candidateReviewFlags(candidate).map((message, index) => ({
      id: `${item.id}:${index}`, item, candidate, message,
      document: candidate.documents.find(doc => message.startsWith(doc.fileName + ':')),
    }));
  });
  const active = entries.find(entry => entry.id === selectedId) || entries[0];
  return <div className="space-y-6 pb-16">
    <div className="bg-white p-5 rounded-xl border flex justify-between gap-4">
      <div><h2 className="font-bold">Discrepancy Review</h2><p className="text-xs text-slate-600 mt-1">Uploaded evidence compared with candidate intake details, including extraction and age review flags.</p></div>
      <span className="text-xs font-semibold text-amber-900">{entries.length} Active Review Flags</span>
    </div>
    {!active ? <div className="p-8 bg-white border rounded-xl text-slate-600">No flagged items in this scope. This does not establish registry verification.</div> : <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 bg-white border rounded-xl overflow-hidden">
        <h3 className="p-4 text-xs font-bold bg-slate-50">Flagged Items Awaiting Review</h3>
        {entries.map(entry => <button type="button" key={entry.id} onClick={() => { setSelectedId(entry.id); setRfiOpen(false); }} className={`w-full p-4 border-t text-left text-xs ${entry.id === active.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
          <p className="font-mono">{entry.item.caseReference}</p><p className="font-bold mt-1">{entry.candidate.fullName}</p><p>{entry.candidate.officeContested}</p><p className="mt-2 text-slate-600">{entry.message}</p>
        </button>)}
      </div>
      <div className="lg:col-span-8 bg-white border rounded-xl p-6 space-y-5">
        <div><h3 className="font-bold">{active.candidate.fullName}</h3><p className="text-xs mt-1">{active.item.caseReference} | Contested Office: {active.candidate.officeContested}</p><StatusBadge status={active.item.workflowStatus} size="sm" /></div>
        <p className="p-4 bg-amber-50 border border-amber-200 rounded text-sm">{active.message}</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="border rounded p-4"><h4 className="font-bold mb-2">Candidate intake details</h4><p>Name: {active.candidate.fullName}</p><p>Date of birth: {active.candidate.dateOfBirth}</p></div>
          <div className="border rounded p-4"><h4 className="font-bold mb-2">Document evidence</h4>{active.document ? <><p>{active.document.fileName}</p>{active.document.extractedFields.filter(field => ['FULL_NAME', 'DATE_OF_BIRTH'].includes(field.fieldKey)).map(field => <p key={field.id}>{field.fieldName}: {field.correctedValue || field.normalizedValue} (page {field.evidencePage})</p>)}{!active.document.extractedFields.length && <p>No extracted claims available.</p>}</> : <p>Intake age/date validation. No document is linked to this flag.</p>}</div>
        </div>
        <p className="text-xs text-slate-600">Registry verification is not configured. Review the original and correct extraction errors in the workbench, or request supporting evidence. A flag does not determine disqualification.</p>
        <div className="flex flex-wrap gap-3">
          {active.document ? <button type="button" className="px-3 py-2 border rounded text-xs" onClick={() => navigateTo('workbench', { caseId: active.item.id, candidateId: active.candidate.id, docId: active.document!.id })}>Open in Document Workbench</button> : <button type="button" className="px-3 py-2 border rounded text-xs" onClick={() => navigateTo('case-overview', { caseId: active.item.id, candidateId: active.candidate.id })}>Open Candidate Case</button>}
          <button type="button" className="px-3 py-2 border rounded text-xs" onClick={() => setRfiOpen(true)}>Issue Statutory RFI</button>
        </div>
      </div>
    </div>}
    {active && <IssueRFIModal key={active.id} isOpen={rfiOpen} onClose={() => setRfiOpen(false)} caseId={active.item.id} caseReference={active.item.caseReference} candidateId={active.candidate.id} candidateName={active.candidate.fullName} initialDiscrepancyRef={active.message} onIssued={async data => {
      await verificationService.createRFI(data, currentUser.name, currentUser.role);
      setRfiOpen(false); await refreshData(); addToast('Information request saved for ' + active.candidate.fullName, 'success');
    }} />}
  </div>;
};
