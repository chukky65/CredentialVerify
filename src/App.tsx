import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/common/AppHeader';
import { SidebarNav } from './components/common/SidebarNav';
import { ToastContainer } from './components/common/ToastContainer';

// Screens
import { SignInScreen } from './components/screens/SignInScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { CandidateDirectoryScreen } from './components/screens/CandidateDirectoryScreen';
import { CreateCandidateScreen } from './components/screens/CreateCandidateScreen';
import { VerificationQueueScreen } from './components/screens/VerificationQueueScreen';
import { CaseOverviewScreen } from './components/screens/CaseOverviewScreen';
import { DocumentWorkbench } from './components/workbench/DocumentWorkbench';
import { DiscrepancyReviewScreen } from './components/screens/DiscrepancyReviewScreen';
import { SourceChecksScreen } from './components/screens/SourceChecksScreen';
import { AuditTrailScreen } from './components/screens/AuditTrailScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { GazetteScreen } from './components/screens/GazetteScreen';
import { ConfigurationScreen } from './components/screens/ConfigurationScreen';
import { UserManagementScreen } from './components/screens/UserManagementScreen';

const MainLayout: React.FC = () => {
  const { highContrastMode, textScaleLarge } = useApp();
  const location = useLocation();
  const isSignIn = location.pathname === '/sign-in' || location.pathname === '/signin';

  if (isSignIn) {
    return (
      <div className={`${highContrastMode ? 'high-contrast' : ''} ${textScaleLarge ? 'text-scale-large' : ''}`}>
        <SignInScreen />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div
      className={`h-screen bg-[#F5F7FA] text-[#17202A] flex font-sans selection:bg-[#2F75B5]/20 selection:text-[#17324D] ${
        highContrastMode ? 'high-contrast' : ''
      } ${textScaleLarge ? 'text-scale-large' : ''}`}
    >
      {/* Sidebar Navigation */}
      <SidebarNav />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global App Header */}
        <AppHeader />

        {/* Main Content Area */}
        <main
          id="main-content-area"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 mx-auto w-full max-w-7xl"
          tabIndex={-1}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardScreen />} />
            <Route path="/candidates" element={<CandidateDirectoryScreen />} />
            <Route path="/candidates/new" element={<CreateCandidateScreen />} />
            <Route path="/candidates/:candidateId" element={<CaseOverviewScreen />} />
            <Route path="/queue" element={<VerificationQueueScreen />} />
            <Route path="/cases" element={<CaseOverviewScreen />} />
            <Route path="/cases/:caseId" element={<CaseOverviewScreen />} />
            <Route path="/cases/:caseId/documents" element={<DocumentWorkbench />} />
            <Route path="/cases/:caseId/documents/:documentId" element={<DocumentWorkbench />} />
            <Route path="/cases/:caseId/discrepancies" element={<DiscrepancyReviewScreen />} />
            <Route path="/discrepancies" element={<DiscrepancyReviewScreen />} />
            <Route path="/sources" element={<SourceChecksScreen />} />
            <Route path="/reports" element={<ReportsScreen />} />
            <Route path="/gazette" element={<GazetteScreen />} />
            <Route path="/audit" element={<AuditTrailScreen />} />
            <Route path="/configuration" element={<ConfigurationScreen />} />
            <Route path="/users" element={<UserManagementScreen />} />
            <Route path="/workbench" element={<DocumentWorkbench />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600">Page not found</p>
              </div>
            } />
          </Routes>
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
