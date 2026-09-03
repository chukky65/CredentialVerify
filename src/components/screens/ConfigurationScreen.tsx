import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatutoryRuleBuilder } from './StatutoryRuleBuilder';
import { Settings, Shield, Clock, FileCheck, Save, AlertCircle, RefreshCw, Scale } from 'lucide-react';

export const ConfigurationScreen: React.FC = () => {
  const { addToast } = useApp();

  const [slaHoursStandard, setSlaHoursStandard] = useState(72);
  const [slaHoursUrgent, setSlaHoursUrgent] = useState(24);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [autoSourceChecks, setAutoSourceChecks] = useState(true);
  const [piiMaskingDefault, setPiiMaskingDefault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsSaving(false);
    addToast('Statutory system parameters and verification rules updated in master config ledger.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">System Configuration & Statutory Rules</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Manage global SLA response thresholds, extraction confidence limits, and statutory verification rules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-md shadow-xs disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Custom Statutory Rule Builder Section */}
      <StatutoryRuleBuilder />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Service Level Agreement (SLA) Thresholds */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2F75B5]" />
              <span>Statutory Turnaround SLA Deadlines</span>
            </h3>
            <p className="text-xs text-[#5B6777]">
              Time limits mandated by Electoral Commission rules before a filing approaches overdue escalation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#17202A] mb-1">
                Standard Priority SLA Target (Hours)
              </label>
              <input
                type="number"
                value={slaHoursStandard}
                onChange={(e) => setSlaHoursStandard(Number(e.target.value))}
                min={12}
                max={168}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: 72 hours (3 business days)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17202A] mb-1">
                Urgent Priority SLA Target (Hours)
              </label>
              <input
                type="number"
                value={slaHoursUrgent}
                onChange={(e) => setSlaHoursUrgent(Number(e.target.value))}
                min={6}
                max={48}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-[#17202A]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Applies to contested hearings & final week filings</span>
            </div>
          </div>
        </div>

        {/* Extraction Engine Confidence Tolerances */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#237A57]" />
              <span>Automated Extraction Confidence Thresholds</span>
            </h3>
            <p className="text-xs text-[#5B6777]">
              Claims extracted below this confidence score are automatically flagged with "Needs Review" status.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#17202A] mb-2">
              <span>Minimum Confidence Threshold for Auto-Pass:</span>
              <span className="font-tabular font-bold text-[#2F75B5] text-sm">{confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2F75B5]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>50% (Permissive)</span>
              <span>75% (Recommended Statutory)</span>
              <span>95% (Strict)</span>
            </div>
          </div>
        </div>

        {/* Privacy & Automation Safeguards */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#17324D]" />
              <span>Privacy & Verification Safeguards</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSourceChecks}
                onChange={(e) => setAutoSourceChecks(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#2F75B5]"
              />
              <div>
                <span className="font-bold text-[#17202A] block">Auto-Query Tier 1 Statutory Registers</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Automatically initiates asynchronous background queries to NADC, Bar, and NRCS registers immediately upon document ingestion.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={piiMaskingDefault}
                onChange={(e) => setPiiMaskingDefault(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#2F75B5]"
              />
              <div>
                <span className="font-bold text-[#17202A] block">Default PII Redaction Masking</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Mask personal dates of birth, phone numbers, and home addresses by default for staff without special clearance.
                </span>
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
