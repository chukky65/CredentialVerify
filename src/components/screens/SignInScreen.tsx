import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

const USERS = [
  { id: 'usr_1', name: 'Elena Vance', email: 'e.vance@elections.state.gov', role: 'VERIFICATION_ANALYST', staffId: 'STAFF-8842', department: 'Verification', isActive: true, lastLoginTimestamp: new Date().toISOString() },
  { id: 'usr_2', name: 'Amina Osei', email: 'amina@elections', role: 'INTAKE_OFFICER', staffId: 'IN-001', department: 'Intake', isActive: true, lastLoginTimestamp: new Date().toISOString() },
  { id: 'usr_3', name: 'James Morrison', email: 'james@elections', role: 'ADMINISTRATOR', staffId: 'AD-001', department: 'IT', isActive: true, lastLoginTimestamp: new Date().toISOString() },
  { id: 'usr_4', name: 'Marcus Chen', email: 'marcus@elections', role: 'SENIOR_ADJUDICATOR', staffId: 'SA-001', department: 'Adjudication', isActive: true, lastLoginTimestamp: new Date().toISOString() }
];

export const SignInScreen: React.FC = () => {
  const { setCurrentUser, navigateTo, addToast } = useApp();
  const [emailOrStaffId, setEmailOrStaffId] = useState('e.vance@elections.state.gov');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!emailOrStaffId.trim()) {
      setErrorMessage('Please enter your authorized email or staff ID.');
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);

    // Find matched user or default to Analyst
    const matchedUser =
      USERS.find(
        (u) =>
          u.email.toLowerCase() === emailOrStaffId.toLowerCase() ||
          u.staffId.toLowerCase() === emailOrStaffId.toLowerCase()
      ) || USERS[0];

    setCurrentUser(matchedUser);
    addToast(`Signed in successfully as ${matchedUser.name} (${matchedUser.role.replace('_', ' ')})`, 'success');
    navigateTo('dashboard');
  };

  const handleQuickPersona = (role: UserRole) => {
    const user = USERS.find((u) => u.role === role) || USERS[0];
    setEmailOrStaffId(user.email);
    setCurrentUser(user as any);
    addToast(`Selected demo profile: ${user.name} (${user.role.replace('_', ' ')})`, 'info');
    navigateTo('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-xl bg-[#17324D] flex items-center justify-center text-white shadow-md mb-4 border border-slate-700">
            <ShieldCheck className="w-8 h-8 text-[#2F75B5]" />
          </div>
          <h1 className="text-2xl font-bold text-[#17202A] tracking-tight">
            CredentialVerify
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6777] mt-1">
            Electoral Candidate Credential Verification System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-[#17202A]">Authorized Staff Sign In</h2>
            <p className="text-xs text-[#5B6777] mt-0.5">
              Access is restricted to authorized electoral verification personnel.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="staff-id-input" className="block text-xs font-semibold text-[#17202A] mb-1">
                Email Address or Staff ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="staff-id-input"
                  type="text"
                  value={emailOrStaffId}
                  onChange={(e) => setEmailOrStaffId(e.target.value)}
                  placeholder="e.g. e.vance@elections.state.gov or STAFF-8842"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:border-[#2F75B5] focus:ring-1 focus:ring-[#2F75B5] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password-input" className="block text-xs font-semibold text-[#17202A]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => addToast('Password reset instructions dispatched to your official agency email.', 'info')}
                  className="text-xs font-medium text-[#2F75B5] hover:text-[#17324D] focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-slate-300 rounded-md focus:border-[#2F75B5] focus:ring-1 focus:ring-[#2F75B5] focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="sign-in-submit-btn"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#17324D] hover:bg-[#112437] text-white text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2F75B5] focus:ring-offset-1 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In with Agency Credentials'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">Or</span>
              </div>
            </div>

            <button
              type="button"
              id="sso-sign-in-btn"
              onClick={() => handleQuickPersona('VERIFICATION_ANALYST')}
              className="w-full py-2 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2F75B5]"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#2F75B5]" />
              Single Sign-On (Agency PIV / CAC Token)
            </button>
          </form>

          {/* Quick Prototype Role Switcher */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Demonstration: Quick Role Access
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickPersona('VERIFICATION_ANALYST')}
                className="p-1.5 text-left border border-slate-200 rounded hover:bg-slate-50 text-[#17324D]"
              >
                <div className="font-semibold">Verification Analyst</div>
                <div className="text-[10px] text-slate-500">Elena Vance</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('SENIOR_ADJUDICATOR')}
                className="p-1.5 text-left border border-slate-200 rounded hover:bg-slate-50 text-[#17324D]"
              >
                <div className="font-semibold">Senior Adjudicator</div>
                <div className="text-[10px] text-slate-500">Marcus Chen</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('INTAKE_OFFICER')}
                className="p-1.5 text-left border border-slate-200 rounded hover:bg-slate-50 text-[#17324D]"
              >
                <div className="font-semibold">Intake Officer</div>
                <div className="text-[10px] text-slate-500">Amina Osei</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPersona('ADMINISTRATOR')}
                className="p-1.5 text-left border border-slate-200 rounded hover:bg-slate-50 text-[#17324D]"
              >
                <div className="font-semibold">Administrator</div>
                <div className="text-[10px] text-slate-500">David Sterling</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security and Authorized Use Notice */}
        <div className="text-center space-y-2 text-[11px] text-[#5B6777]">
          <p className="font-medium text-slate-600">
            Official System of the Electoral Credential Verification Authority
          </p>
          <p className="max-w-sm mx-auto leading-relaxed">
            Unauthorized access or misuse is strictly prohibited under Federal Electoral Acts. All sessions and verification queries are cryptographically logged and audited.
          </p>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-400 pt-6">
        CredentialVerify • Assisted Document Verification Platform • Non-production prototype
      </footer>
    </div>
  );
};
