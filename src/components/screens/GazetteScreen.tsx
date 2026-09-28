import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { DossierModal } from './DossierModal';
import { electionOptions } from '../../services/electionScope';
import { prerequisiteChecks } from '../../services/prerequisiteChecks';
import { FileText, Download, ExternalLink } from 'lucide-react';

export const GazetteScreen: React.FC = () => {
  const { cases, candidates, navigateTo } = useApp();
  const [selectedElection, setSelectedElection] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const entries = cases.flatMap(item => {
    const candidate = candidates.find(c => c.id === item.candidateId);
    return candidate ? [{ item, candidate }] : [];
  });
  const filtered = entries.filter(({ item, candidate }) =>
    (selectedElection === 'ALL' || candidate.electionName === selectedElection) &&
    [candidate.fullName, candidate.referenceCode, item.caseReference, candidate.officeContested].some(value => value.toLowerCase().includes(search.toLowerCase())));
  const selected = entries.find(entry => entry.item.id === selectedCaseId);
  const exportRows = () => {
    const cell = (value: string) => '"' + (/^[=+@-]/.test(value) ? "'" : '') + value.replace(/"/g, '""') + '"';
    const rows = [['Case reference', 'Candidate', 'Office', 'Election', 'Review status', 'Recommendation', 'Publication status'],
      ...filtered.map(({ item, candidate }) => [item.caseReference, candidate.fullName, candidate.officeContested, candidate.electionName, item.workflowStatus, item.recommendation?.recommendationType || 'Not recorded', 'Not published'])];
    const url = URL.createObjectURL(new Blob([rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'candidate-review-register.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="space-y-5 pb-12">
    <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-wrap justify-between gap-3">
      <div><h2 className="text-lg font-bold text-[#17202A]">Gazette Publication</h2><p className="text-xs text-slate-600 mt-1">Candidate dossiers and recorded recommendations for publication preparation.</p></div>
      <div className="no-print flex gap-2"><button type="button" onClick={() => window.print()} className="text-xs px-3 py-2 border rounded">Print review register</button><button type="button" onClick={exportRows} className="flex items-center gap-2 text-xs px-3 py-2 border rounded"><Download className="w-4 h-4" />Export review register</button></div>
    </div>
    <p className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950">These are registered candidate case records. An analyst recommendation is not a gazette publication or final ballot determination. No publication records are configured.</p>
    <div className="bg-white p-4 rounded-xl border flex flex-wrap gap-3">
      <input aria-label="Search gazette candidate records" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidate, case or office" className="text-sm p-2 border rounded flex-1" />
      <select aria-label="Gazette election filter" value={selectedElection} onChange={e => setSelectedElection(e.target.value)} className="text-sm p-2 border rounded">
        <option value="ALL">All Elections</option>{electionOptions(candidates).map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
    <div className="bg-white rounded-xl border overflow-x-auto"><table className="w-full text-left text-xs">
      <thead className="bg-slate-50"><tr>{['Candidate / Case', 'Office / Election', 'Evidence review', 'Recorded recommendation', 'Actions'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
      <tbody>{filtered.map(({ item, candidate }) => <tr key={item.id} className="border-t">
        <td className="p-3"><p className="font-bold">{candidate.fullName}</p><p className="font-mono text-slate-500 mt-1">{item.caseReference}</p></td>
        <td className="p-3"><p>{candidate.officeContested}</p><p className="text-slate-500 mt-1">{candidate.electionName}</p></td>
        <td className="p-3"><StatusBadge status={item.workflowStatus} size="sm" /><p className="text-slate-500 mt-1">{prerequisiteChecks(candidate).filter(c => c.status === 'Document reviewed').length} credential categories reviewed</p></td>
        <td className="p-3">{item.recommendation?.recommendationType.replace(/_/g, ' ') || 'Not recorded'}<p className="text-slate-500 mt-1">{item.recommendation?.submittedTimestamp}</p></td>
        <td className="p-3"><div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelectedCaseId(item.id)} className="flex items-center gap-1 px-3 py-2 rounded bg-[#17324D] text-white" aria-label={'Dossier for ' + candidate.fullName}><FileText className="w-3 h-3" />Dossier</button>
          <button type="button" onClick={() => navigateTo('case-overview', { caseId: item.id, candidateId: candidate.id })} className="flex items-center gap-1 px-3 py-2 border rounded"><ExternalLink className="w-3 h-3" />Open case</button>
        </div></td>
      </tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No registered candidate records match this view.</td></tr>}</tbody>
    </table></div>
    <div className="bg-white rounded-xl border p-5 grid sm:grid-cols-2 gap-8 break-inside-avoid" aria-label="Blank sign-off fields">
      {['Prepared by', 'Reviewed by'].map(label => <div key={label} className="text-sm space-y-4"><h3 className="font-bold">{label}</h3><p>Name: ______________________________</p><p>Signature: ___________________________</p><p>Date: _______________________________</p></div>)}
    </div>
    {selected && <DossierModal key={selected.item.id} isOpen onClose={() => setSelectedCaseId(null)} caseRecord={selected.item} candidate={selected.candidate} />}
  </div>;
};
