import React, { useState } from 'react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { StatutoryRule, CredentialType } from '../../types';
import { Scale, BookOpen, AlertTriangle, ShieldCheck, Tag, Info, Check } from 'lucide-react';

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: StatutoryRule | null;
  onSave: (ruleData: Omit<StatutoryRule, 'id' | 'createdAt'>) => void;
}

const CREDENTIAL_OPTIONS: { type: CredentialType | 'ALL'; label: string }[] = [
  { type: 'ALL', label: 'All Credential Types' },
  { type: 'CITIZENSHIP', label: 'Citizenship & Identity' },
  { type: 'ACADEMIC_DEGREE', label: 'Academic Degree Qualification' },
  { type: 'PROFESSIONAL_LICENSE', label: 'Professional Bar / Licensure' },
  { type: 'FINANCIAL_DISCLOSURE', label: 'Financial & Asset Disclosure' },
  { type: 'SECURITY_CLEARANCE', label: 'Security Clearance Attestation' },
];

const OFFICE_OPTIONS = [
  { value: 'ALL', label: 'All Contested Offices' },
  { value: 'Member of Parliament', label: 'Member of Parliament' },
  { value: 'Governor of Capital Territory', label: 'Governor of Capital Territory' },
  { value: 'Appellate Division Judge', label: 'Appellate Division Judge' },
  { value: 'Mayor of Metro District', label: 'Mayor of Metro District' },
];

const OPERATOR_OPTIONS: { value: StatutoryRule['operator']; label: string }[] = [
  { value: 'CONTAINS', label: 'Text Contains (Substring)' },
  { value: 'EQUALS', label: 'Strictly Equals (=)' },
  { value: 'NOT_EQUALS', label: 'Does Not Equal (≠)' },
  { value: 'NOT_EMPTY', label: 'Field Is Present & Non-Empty' },
  { value: 'IS_EMPTY', label: 'Field Must Be Empty' },
  { value: 'GREATER_THAN', label: 'Numerical / Years Greater Than (>)' },
  { value: 'LESS_THAN', label: 'Numerical / Years Less Than (<)' },
  { value: 'DATE_BEFORE', label: 'Date Must Be Before (< Date)' },
  { value: 'DATE_AFTER', label: 'Date Must Be After (> Date)' },
];

const SEVERITY_OPTIONS: { value: StatutoryRule['severity']; label: string; desc: string; badgeColor: string }[] = [
  {
    value: 'CRITICAL_DISQUALIFICATION',
    label: 'Critical Disqualification',
    desc: 'Statutory bar from ballot unless cured or overturned by judicial order.',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    value: 'MANDATORY_FLAG',
    label: 'Mandatory Audit Flag',
    desc: 'Halts automated clearance; requires senior review and explicit analyst clearance.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    value: 'ADVISORY_SCRUTINY',
    label: 'Advisory Scrutiny',
    desc: 'Logged in scrutiny notes for commissioner consideration during hearing.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
];

const ACTION_OPTIONS: { value: StatutoryRule['actionOnFail']; label: string }[] = [
  { value: 'AUTO_FLAG_DISCREPANCY', label: 'Auto-Generate Discrepancy Case Item' },
  { value: 'BLOCK_RECOMMENDATION', label: 'Block "Requirements Satisfied" Clearance' },
  { value: 'REQUIRE_AFFIDAVIT', label: 'Require Supplementary Notarized Affidavit' },
  { value: 'ESCALATE_TO_CHAIR', label: 'Escalate to Commission Bench Chair' },
];

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
  onSave,
}) => {
  const [ruleCode, setRuleCode] = useState(ruleToEdit?.ruleCode || '');
  const [name, setName] = useState(ruleToEdit?.name || '');
  const [description, setDescription] = useState(ruleToEdit?.description || '');
  const [targetOffice, setTargetOffice] = useState(ruleToEdit?.targetOffice || 'ALL');
  const [credentialType, setCredentialType] = useState<CredentialType | 'ALL'>(
    ruleToEdit?.credentialType || 'ALL'
  );
  const [fieldKey, setFieldKey] = useState(ruleToEdit?.fieldKey || '');
  const [operator, setOperator] = useState<StatutoryRule['operator']>(
    ruleToEdit?.operator || 'CONTAINS'
  );
  const [expectedValue, setExpectedValue] = useState(ruleToEdit?.expectedValue || '');
  const [statutoryBasis, setStatutoryBasis] = useState(ruleToEdit?.statutoryBasis || '');
  const [severity, setSeverity] = useState<StatutoryRule['severity']>(
    ruleToEdit?.severity || 'MANDATORY_FLAG'
  );
  const [actionOnFail, setActionOnFail] = useState<StatutoryRule['actionOnFail']>(
    ruleToEdit?.actionOnFail || 'AUTO_FLAG_DISCREPANCY'
  );
  const [isActive, setIsActive] = useState(ruleToEdit?.isActive ?? true);
  const [error, setError] = useState('');

  // Reset or initialize state when opening
  React.useEffect(() => {
    if (ruleToEdit) {
      setRuleCode(ruleToEdit.ruleCode);
      setName(ruleToEdit.name);
      setDescription(ruleToEdit.description);
      setTargetOffice(ruleToEdit.targetOffice);
      setCredentialType(ruleToEdit.credentialType);
      setFieldKey(ruleToEdit.fieldKey);
      setOperator(ruleToEdit.operator);
      setExpectedValue(ruleToEdit.expectedValue);
      setStatutoryBasis(ruleToEdit.statutoryBasis);
      setSeverity(ruleToEdit.severity);
      setActionOnFail(ruleToEdit.actionOnFail);
      setIsActive(ruleToEdit.isActive);
    } else {
      setRuleCode(`STAT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`);
      setName('');
      setDescription('');
      setTargetOffice('ALL');
      setCredentialType('ALL');
      setFieldKey('');
      setOperator('CONTAINS');
      setExpectedValue('');
      setStatutoryBasis('Electoral Act § 14');
      setSeverity('MANDATORY_FLAG');
      setActionOnFail('AUTO_FLAG_DISCREPANCY');
      setIsActive(true);
    }
    setError('');
  }, [ruleToEdit, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please provide a descriptive rule name.');
      return;
    }
    if (!statutoryBasis.trim()) {
      setError('Statutory legal citation basis is required.');
      return;
    }
    if (!fieldKey.trim() && operator !== 'NOT_EMPTY' && operator !== 'IS_EMPTY') {
      setError('Target extracted field key is required (e.g. license_status, degree_title).');
      return;
    }

    onSave({
      ruleCode: ruleCode.trim() || `STAT-RULE-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Automated verification check derived from statutory election rules.',
      targetOffice,
      credentialType,
      fieldKey: fieldKey.trim() || 'all_fields',
      operator,
      expectedValue: expectedValue.trim(),
      statutoryBasis: statutoryBasis.trim(),
      severity,
      actionOnFail,
      isActive,
      createdBy: 'Elena Vance (Lead Analyst)',
    });

    onClose();
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleSubmit}
      title={ruleToEdit ? 'Edit Statutory Verification Rule' : 'Promulgate New Statutory Rule'}
      description="Configure automated legal prerequisites, credential validation logic, and fail-safe policy actions."
      confirmLabel={ruleToEdit ? 'Save Changes' : 'Promulgate Rule'}
      cancelLabel="Cancel"
      variant="primary"
    >
      <div className="space-y-4 pt-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Rule Code & Active Status */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-slate-700 font-semibold mb-1">Rule Statutory Code *</label>
            <input
              type="text"
              value={ruleCode}
              onChange={(e) => setRuleCode(e.target.value)}
              placeholder="e.g. STAT-BAR-EXP-15YR"
              className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Enforcement State</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-full py-1.5 px-3 rounded font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border-slate-300'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-20'}`} />
              <span>{isActive ? 'Active' : 'Disabled'}</span>
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Rule Name & Summary *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Mandatory 15-Year Bar Good Standing for Appellate Judges"
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
          />
        </div>

        {/* Statutory Citation Basis */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Statutory Legal Basis / Citation Reference *
          </label>
          <div className="relative">
            <Scale className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={statutoryBasis}
              onChange={(e) => {
                setStatutoryBasis(e.target.value);
                setError('');
              }}
              placeholder="e.g. Judicial Appointments Act § 8(2) & Electoral Integrity Code § 14"
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Scope Selectors: Office & Credential */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Applicable Contested Office</label>
            <select
              value={targetOffice}
              onChange={(e) => setTargetOffice(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none"
            >
              {OFFICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Target Credential Type</label>
            <select
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none"
            >
              {CREDENTIAL_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Condition Engine: Field Key, Operator, Expected Value */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="text-slate-800 font-bold flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
            <Tag className="w-3.5 h-3.5 text-[#2F75B5]" />
            <span>Logical Condition Specification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Extracted Field Key *
              </label>
              <input
                type="text"
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                placeholder="e.g. license_status"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-[11px] bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Operator
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as any)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-[11px] bg-white focus:outline-none"
              >
                {OPERATOR_OPTIONS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Expected Value / Pattern
              </label>
              <input
                type="text"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                placeholder={operator === 'NOT_EMPTY' ? '(Not applicable)' : 'e.g. Active - In Good Standing'}
                disabled={operator === 'NOT_EMPTY' || operator === 'IS_EMPTY'}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-[11px] bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Severity & Action on Violation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Violation Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none"
            >
              {SEVERITY_OPTIONS.map((sev) => (
                <option key={sev.value} value={sev.value}>
                  {sev.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Action on Non-Compliance</label>
            <select
              value={actionOnFail}
              onChange={(e) => setActionOnFail(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none"
            >
              {ACTION_OPTIONS.map((act) => (
                <option key={act.value} value={act.value}>
                  {act.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Legal Commentary / Guidance</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the statutory intent, case law precedents, or administrative instructions..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#2F75B5] focus:outline-none"
          />
        </div>
      </div>
    </ConfirmationModal>
  );
};
