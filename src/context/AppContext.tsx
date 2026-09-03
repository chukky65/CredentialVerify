/**
 * AppContext - Global State & Role Management for CredentialVerify
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserAccount, UserRole, Candidate, VerificationCase, AuditLogEvent, AppRoute } from '../types';
import { verificationService } from '../services/verificationService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  switchRole: (role: UserRole) => void;
  currentRoute: string;
  currentScreen: string;
  navigateTo: (route: AppRoute | string, params?: { caseId?: string; candidateId?: string; docId?: string; fieldId?: string }) => void;
  activeCaseId: string;
  setActiveCaseId: (id: string) => void;
  activeCandidateId: string;
  setActiveCandidateId: (id: string) => void;
  activeDocumentId: string;
  setActiveDocumentId: (id: string) => void;
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  maskSensitiveData: boolean;
  setMaskSensitiveData: React.Dispatch<React.SetStateAction<boolean>>;
  sessionSecondsRemaining: number;
  resetSessionTimer: () => void;
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  highContrastMode: boolean;
  toggleHighContrast: () => void;
  textScaleLarge: boolean;
  toggleTextScale: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  cases: VerificationCase[];
  candidates: Candidate[];
  auditEvents: AuditLogEvent[];
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USERS: UserAccount[] = [
  { id: 'usr_1', name: 'Elena Vance', email: 'elena@elections', role: 'VERIFICATION_ANALYST', staffId: 'AN-001', department: 'Verification', isActive: true, lastLoginTimestamp: new Date().toISOString() },
  { id: 'usr_2', name: 'Amina Osei', email: 'amina@elections', role: 'INTAKE_OFFICER', staffId: 'IN-001', department: 'Intake', isActive: true, lastLoginTimestamp: new Date().toISOString() },
  { id: 'usr_3', name: 'James Morrison', email: 'james@elections', role: 'ADMINISTRATOR', staffId: 'AD-001', department: 'IT', isActive: true, lastLoginTimestamp: new Date().toISOString() }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserAccount>(USERS[0]); // default: Elena Vance (Analyst)
  const currentRoute = location.pathname.substring(1) || 'dashboard'; // fallback
  const [activeCaseId, setActiveCaseId] = useState<string>('case_001');
  const [activeCandidateId, setActiveCandidateId] = useState<string>('cand_001');
  const [activeDocumentId, setActiveDocumentId] = useState<string>('doc_001_deg');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('fld_deg_03');
  const [maskSensitiveData, setMaskSensitiveData] = useState<boolean>(true);
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState<number>(900); // 15 mins
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(() => {
    return localStorage.getItem('cv_high_contrast') === 'true';
  });
  const [textScaleLarge, setTextScaleLarge] = useState<boolean>(() => {
    return localStorage.getItem('cv_text_scale_large') === 'true';
  });
  const [globalSearch, setGlobalSearch] = useState<string>('');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleHighContrast = () => {
    setHighContrastMode((prev) => {
      const next = !prev;
      localStorage.setItem('cv_high_contrast', String(next));
      return next;
    });
    addToast(
      !highContrastMode ? 'High-contrast mode enabled (WCAG AAA).' : 'Standard contrast mode restored.',
      'info'
    );
  };

  const toggleTextScale = () => {
    setTextScaleLarge((prev) => {
      const next = !prev;
      localStorage.setItem('cv_text_scale_large', String(next));
      return next;
    });
    addToast(
      !textScaleLarge ? 'Enlarged typography mode enabled.' : 'Standard typography scale restored.',
      'info'
    );
  };

  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditLogEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fetchedCases, fetchedCandidates, fetchedAudit] = await Promise.all([
        verificationService.getCases(),
        verificationService.getCandidates(),
        verificationService.getAuditLogs(),
      ]);
      setCases(fetchedCases);
      setCandidates(fetchedCandidates);
      setAuditEvents(fetchedAudit);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Session timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetSessionTimer = () => {
    setSessionSecondsRemaining(900);
    addToast('Session timeout extended.', 'info');
  };

  const switchRole = (role: UserRole) => {
    const match = USERS.find((u) => u.role === role) || USERS[0];
    setCurrentUser(match);
    addToast(`Switched active user context to ${match.name} (${role.replace(/_/g, ' ')})`, 'info');
  };

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (
    route: AppRoute | string,
    params?: { caseId?: string; candidateId?: string; docId?: string; fieldId?: string }
  ) => {
    if (params?.caseId) setActiveCaseId(params.caseId);
    if (params?.candidateId) setActiveCandidateId(params.candidateId);
    if (params?.docId) setActiveDocumentId(params.docId);
    if (params?.fieldId !== undefined) setSelectedFieldId(params.fieldId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Map existing AppRoute to valid React Router paths
    let targetPath = `/${route}`;
    if (route === 'case-overview' || route === 'cases') {
      targetPath = params?.caseId ? `/cases/${params.caseId}` : '/cases';
    } else if (route === 'workbench') {
      if (params?.caseId && params?.docId) {
        targetPath = `/cases/${params.caseId}/documents/${params.docId}`;
      } else if (params?.caseId) {
        targetPath = `/cases/${params.caseId}/documents`;
      } else {
        targetPath = '/workbench';
      }
    } else if (route === 'discrepancy-review' || route === 'discrepancies') {
      targetPath = params?.caseId ? `/cases/${params.caseId}/discrepancies` : '/discrepancies';
    }
    
    navigate(targetPath);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        currentRoute,
        currentScreen: currentRoute,
        navigateTo,
        activeCaseId,
        setActiveCaseId,
        activeCandidateId,
        setActiveCandidateId,
        activeDocumentId,
        setActiveDocumentId,
        selectedFieldId,
        setSelectedFieldId,
        maskSensitiveData,
        setMaskSensitiveData,
        sessionSecondsRemaining,
        resetSessionTimer,
        toasts,
        addToast,
        removeToast,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        highContrastMode,
        toggleHighContrast,
        textScaleLarge,
        toggleTextScale,
        globalSearch,
        setGlobalSearch,
        cases,
        candidates,
        auditEvents,
        refreshData,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
