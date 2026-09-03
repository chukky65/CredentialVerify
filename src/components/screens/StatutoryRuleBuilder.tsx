import React, { useState, useEffect } from 'react';
import { StatutoryRule } from '../../types';
import { verificationService } from '../../services/verificationService';
import { RuleEditorModal } from './RuleEditorModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useApp } from '../../context/AppContext';
import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const StatutoryRuleBuilder: React.FC = () => {
  const { currentUser, addToast } = useApp();
  const [rules, setRules] = useState<StatutoryRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOffice, setFilterOffice] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<StatutoryRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<StatutoryRule | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadRules = async () => {
    setIsLoading(true);
    const data = await verificationService.getStatutoryRules();
    setRules(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleRuleActive = async (rule: StatutoryRule) => {
    const updated = await verificationService.updateStatutoryRule(
      rule.id,
      { isActive: !rule.isActive },
      currentUser.name,
      currentUser.role
    );
    if (updated) {
      await loadRules();
      addToast(
        `Rule [${rule.ruleCode}] ${!rule.isActive ? 'enacted & activated' : 'suspended'}.`,
        !rule.isActive ? 'success' : 'info'
      );
    }
  };

  const handleSaveRule = async (ruleData: Omit<StatutoryRule, 'id' | 'createdAt'>) => {
    if (editingRule) {
      const updated = await verificationService.updateStatutoryRule(
        editingRule.id,
        ruleData,
        currentUser.name,
        currentUser.role
      );
      if (updated) {
        await loadRules();
        addToast(`Statutory Rule [${ruleData.ruleCode}] updated in master config ledger.`, 'success');
      }
    } else {
      const created = await verificationService.createStatutoryRule(
        ruleData,
        currentUser.name,
        currentUser.role
      );
      if (created) {
        await loadRules();
        addToast(`New statutory rule [${ruleData.ruleCode}] promulgated successfully.`, 'success');
      }
    }
    setEditingRule(null);
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    const success = await verificationService.deleteStatutoryRule(
      ruleToDelete.id,
      currentUser.name,
      currentUser.role
    );
    if (success) {
      await loadRules();
      addToast(`Statutory rule [${ruleToDelete.ruleCode}] revoked.`, 'info');
      setRuleToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.statutoryBasis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fieldKey.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOffice = filterOffice === 'ALL' || r.targetOffice === filterOffice || r.targetOffice === 'ALL';
    const matchesSeverity = filterSeverity === 'ALL' || r.severity === filterSeverity;

    return matchesSearch && matchesOffice && matchesSeverity;
  });

  const getSeverityBadge = (severity: StatutoryRule['severity']) => {
    switch (severity) {
      case 'CRITICAL_DISQUALIFICATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
            Critical Disqualification
          </span>
        );
      case 'MANDATORY_FLAG':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Mandatory Flag
          </span>
        );
      case 'ADVISORY_SCRUTINY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Advisory Scrutiny
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
      {/* Header & Promulgate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-[#17202A] flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#B7791F]" />
            <span>Statutory Verification Rule Engine & Legal Criteria Builder</span>
          </h3>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Define automated legal rules, eligibility constraints, and mandatory discrepancy triggers derived from the Electoral Act.
          </p>
        </div>

        <button
          type="button"
          id="promulgate-new-rule-btn"
          onClick={() => {
            setEditingRule(null);
            setIsEditorOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-md shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Promulgate New Rule</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by rule code, name, statute citation, or target field key..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F75B5]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterOffice}
            onChange={(e) => setFilterOffice(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-[#17202A] focus:outline-none"
          >
            <option value="ALL">All Offices</option>
            <option value="Member of Parliament">Member of Parliament</option>
            <option value="Governor of Capital Territory">Governor</option>
            <option value="Appellate Division Judge">Appellate Judge</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-[#17202A] focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL_DISQUALIFICATION">Critical Disqualification</option>
            <option value="MANDATORY_FLAG">Mandatory Flag</option>
            <option value="ADVISORY_SCRUTINY">Advisory Scrutiny</option>
          </select>
        </div>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading statutory rule ledger...</div>
      ) : filteredRules.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
          No statutory rules found matching your filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-lg border transition-all ${
                rule.isActive
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              {/* Top Row: Code, Name, Severity & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-[#17324D] bg-slate-100 px-2 py-0.5 rounded">
                      {rule.ruleCode}
                    </span>
                    <h4 className="text-xs font-bold text-[#17202A]">{rule.name}</h4>
                    {getSeverityBadge(rule.severity)}
                    {!rule.isActive && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                        Suspended
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => handleToggleRuleActive(rule)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-colors ${
                      rule.isActive
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                    }`}
                  >
                    {rule.isActive ? 'Suspend' : 'Activate'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingRule(rule);
                      setIsEditorOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-[#17324D] hover:bg-slate-100 rounded border border-transparent hover:border-slate-200"
                    title="Edit Rule Parameters"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRuleToDelete(rule);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-200"
                    title="Revoke Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Logic Summary Pill Row */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-500">Statutory Basis:</span>
                  <span className="font-mono text-slate-900 font-medium">{rule.statutoryBasis}</span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-500">Scope:</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-medium">
                    {rule.targetOffice} ({rule.credentialType})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-500">Condition:</span>
                  <code className="bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded font-mono text-[10.5px]">
                    {rule.fieldKey} {rule.operator} "{rule.expectedValue || '*'}"
                  </code>
                </div>

                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-500">On Non-Compliance:</span>
                  <span className="font-bold text-[#17324D]">
                    {rule.actionOnFail.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <RuleEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRule(null);
        }}
        ruleToEdit={editingRule}
        onSave={handleSaveRule}
      />

      {/* Delete / Revoke Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setRuleToDelete(null);
        }}
        onConfirm={handleDeleteRule}
        title="Revoke Statutory Rule"
        description={`Are you sure you want to permanently revoke rule [${ruleToDelete?.ruleCode}] "${ruleToDelete?.name}" from the automated verification engine? This action is permanently logged to the audit ledger.`}
        confirmLabel="Revoke Rule"
        cancelLabel="Keep Rule"
        variant="danger"
      />
    </div>
  );
};
