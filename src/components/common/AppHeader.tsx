import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Search,
  Eye,
  EyeOff,
  Bell,
  Clock,
  Shield,
  UserCheck,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
  Menu,
  Contrast,
  Type,
} from 'lucide-react';

interface AppHeaderProps {
  pageTitle?: string;
  pageSubtitle?: string;
  onOpenMobileMenu?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  pageTitle: customTitle,
  pageSubtitle: customSubtitle,
  onOpenMobileMenu,
}) => {
  const {
    currentUser,
    switchRole,
    maskSensitiveData,
    setMaskSensitiveData,
    sessionSecondsRemaining,
    resetSessionTimer,
    globalSearch,
    setGlobalSearch,
    navigateTo,
    addToast,
    currentRoute,
    activeCaseId,
    cases,
    highContrastMode,
    toggleHighContrast,
    textScaleLarge,
    toggleTextScale,
    toggleMobileMenu,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  // Derive dynamic page title if not explicitly passed
  let title = customTitle;
  let subtitle = customSubtitle;

  if (!title) {
    switch (currentRoute) {
      case 'dashboard':
        title = 'Operational Verification Dashboard';
        subtitle = 'Electoral candidate eligibility and statutory credential monitoring';
        break;
      case 'candidates':
        title = 'Candidate Registry & Dossiers';
        subtitle = 'Authorized registry of registered electoral contestants';
        break;
      case 'create-candidate':
        title = 'Candidate Ingestion & Intake Wizard';
        subtitle = 'Official package intake with automated document quality validation';
        break;
      case 'queue':
        title = 'Verification Priority Queue';
        subtitle = 'Assisted claim verification workflow & SLA triage';
        break;
      case 'case-overview':
        title = activeCase ? `Case #${activeCase.caseReference}: ${activeCase.candidateName}` : 'Case Overview';
        subtitle = activeCase ? `${activeCase.officeContested} • ${activeCase.electionName}` : 'Dossier Details';
        break;
      case 'workbench':
        title = activeCase ? `Case #${activeCase.caseReference}: ${activeCase.candidateName}` : 'Document Review Workbench';
        subtitle = activeCase ? `${activeCase.officeContested} • Evidence Review` : 'Assisted Claim Corroboration';
        break;
      case 'discrepancies':
        title = 'Discrepancy Reconciliation Review';
        subtitle = 'Corroboration between candidate claims and authoritative statutory registers';
        break;
      case 'source-checks':
        title = 'Authoritative Registry Connectors';
        subtitle = 'Statutory source telemetry, uptime monitoring, and query logs';
        break;
      case 'audit-trail':
        title = 'Statutory Audit & Cryptographic Ledger';
        subtitle = 'Immutable SHA-256 chained transaction logs and decision records';
        break;
      case 'reports':
        title = 'Compliance & Throughput Reports';
        subtitle = 'Statutory turnaround metrics, correction rates, and SLA adherence';
        break;
      case 'gazette':
        title = 'Official Electoral Gazette Publication';
        subtitle = 'Promulgated candidate clearance registry and ballot qualification records';
        break;
      case 'configuration':
        title = 'System Configuration & Statutory Rules';
        subtitle = 'Electoral parameters, SLA thresholds, and evidence rule engines';
        break;
      case 'user-management':
        title = 'Authorized Personnel & Access Control';
        subtitle = 'Role-based access management and security credentials';
        break;
      default:
        title = 'CredentialVerify Platform';
        subtitle = 'Electoral Commission Verification System';
        break;
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const rolesList: Array<{ role: UserRole; title: string; desc: string }> = [
    { role: 'INTAKE_OFFICER', title: 'Intake Officer', desc: 'Create candidates & intake checks' },
    { role: 'VERIFICATION_ANALYST', title: 'Verification Analyst', desc: 'Review claims & source checks' },
    { role: 'SENIOR_ADJUDICATOR', title: 'Senior Adjudicator', desc: 'Review escalated & restricted cases' },
    { role: 'ADMINISTRATOR', title: 'Administrator', desc: 'System config & user management' },
    { role: 'AUDITOR', title: 'Auditor', desc: 'Read-only audit & evidence inspection' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-xs flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left Section: Title & Mobile Hamburger */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          id="mobile-menu-toggle-btn"
          onClick={onOpenMobileMenu || toggleMobileMenu}
          className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-[#17202A] tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[#5B6777] hidden md:block truncate">
                {subtitle}
              </p>
            )}
          </div>

          {(currentRoute === 'workbench' || currentRoute === 'case-overview') && activeCase && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-[#B7791F]/10 text-[#B7791F] text-[11px] font-bold rounded border border-[#B7791F]/30 uppercase tracking-wide">
              Needs Review
            </span>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 max-w-sm mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="global-search-input"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search candidate, case ID, or ref..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#F5F7FA] border border-gray-200 rounded-md text-xs text-[#17202A] placeholder-slate-400 focus:bg-white focus:border-[#2F75B5] focus:outline-none focus:ring-1 focus:ring-[#2F75B5] transition-all"
          />
        </div>
      </div>

      {/* Right Section: Controls, Accessibility, Role Switcher, Session, User */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* High-Contrast Mode Toggle */}
        <button
          type="button"
          id="toggle-high-contrast-btn"
          onClick={toggleHighContrast}
          title={highContrastMode ? 'High Contrast Mode is ON (click for Standard)' : 'Switch to High Contrast Accessibility Mode'}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5] ${
            highContrastMode
              ? 'bg-black text-white border-black ring-1 ring-black'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Toggle High Contrast Mode"
        >
          <Contrast className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">Contrast</span>
        </button>

        {/* Text Scale Toggle */}
        <button
          type="button"
          id="toggle-text-scale-btn"
          onClick={toggleTextScale}
          title={textScaleLarge ? 'Text scaling is Large (+10%)' : 'Switch to Large Accessible Typography'}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5] ${
            textScaleLarge
              ? 'bg-[#17324D] text-white border-[#17324D]'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Toggle Large Typography Scale"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px] font-mono">{textScaleLarge ? 'A+' : 'A'}</span>
        </button>

        {/* Sensitive Data PII Masking Toggle */}
        <button
          type="button"
          id="toggle-pii-masking-btn"
          onClick={() => {
            setMaskSensitiveData((prev) => !prev);
            addToast(
              maskSensitiveData
                ? 'Sensitive personal data unmasked for inspection.'
                : 'Sensitive personal data masked for privacy.',
              'info'
            );
          }}
          title={maskSensitiveData ? 'PII is currently masked (click to reveal)' : 'PII is unmasked (click to mask)'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5] ${
            maskSensitiveData
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
          }`}
        >
          {maskSensitiveData ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">PII Masked</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xl:inline">PII Visible</span>
            </>
          )}
        </button>

        {/* Session Expiry Countdown */}
        <div 
          onClick={resetSessionTimer}
          title="Click to refresh authorized session"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-tabular cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatTime(sessionSecondsRemaining)}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            id="notifications-menu-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B7791F] rounded-full ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 animate-fade-in"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#17202A] uppercase tracking-wider">
                  System Notifications
                </span>
                <span className="text-[11px] text-[#5B6777]">3 New</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 text-xs">
                  <p className="font-semibold text-[#17202A]">Discrepancy Flagged</p>
                  <p className="text-slate-600 mt-0.5">Discrepancy review pending on Case CASE-2026-0081-JC.</p>
                  <span className="text-[10px] text-slate-400">12 mins ago</span>
                </div>
                <div className="p-3 hover:bg-slate-50 text-xs">
                  <p className="font-semibold text-[#17202A]">Connector Recovery</p>
                  <p className="text-slate-600 mt-0.5">National Academic Clearinghouse response latency stabilized.</p>
                  <span className="text-[10px] text-slate-400">1 hour ago</span>
                </div>
                <div className="p-3 hover:bg-slate-50 text-xs">
                  <p className="font-semibold text-[#17202A]">Filing Period Intake</p>
                  <p className="text-slate-600 mt-0.5">New candidate registration verified for Constituency 7.</p>
                  <span className="text-[10px] text-slate-400">2 hours ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Role Selector (Testing & Demonstration Feature) */}
        <div className="relative">
          <button
            type="button"
            id="role-switcher-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-md bg-[#17324D]/5 hover:bg-[#17324D]/10 border border-[#17324D]/15 text-xs text-[#17324D] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
            title="Change active simulation role"
          >
            <Shield className="w-3.5 h-3.5 text-[#2F75B5]" />
            <span className="hidden sm:inline font-semibold">
              {currentUser.role.replace(/_/g, ' ')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showRoleMenu && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 animate-fade-in"
              onMouseLeave={() => setShowRoleMenu(false)}
            >
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-[#17202A]">Switch Active Role Context</p>
                <p className="text-[11px] text-[#5B6777]">Test role-based permissions & features</p>
              </div>
              <div className="p-1 space-y-1">
                {rolesList.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      switchRole(item.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-start justify-between ${
                      currentUser.role === item.role
                        ? 'bg-[#2F75B5]/10 text-[#17324D] font-semibold'
                        : 'hover:bg-slate-100 text-[#17202A]'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-[11px] text-[#5B6777]">{item.desc}</p>
                    </div>
                    {currentUser.role === item.role && (
                      <UserCheck className="w-4 h-4 text-[#2F75B5] shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div 
            className="w-8 h-8 rounded-full bg-[#16838D] text-white font-semibold flex items-center justify-center text-xs shadow-xs"
            title={`${currentUser.name} (${currentUser.staffId})`}
          >
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <button
            type="button"
            id="sign-out-btn"
            onClick={() => navigateTo('signin')}
            className="p-1.5 text-slate-400 hover:text-[#B83232] rounded hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
