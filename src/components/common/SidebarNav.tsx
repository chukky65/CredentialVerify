import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppRoute } from '../../types';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  FolderKanban,
  FileSearch,
  Building2,
  BarChart3,
  ScrollText,
  Newspaper,
  Settings,
  UserCog,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Scale,
} from 'lucide-react';

interface SidebarNavProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  isMobileOpen: propIsMobileOpen,
  onCloseMobile: propOnCloseMobile,
}) => {
  const {
    currentRoute,
    navigateTo,
    currentUser,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileMenuOpen,
    closeMobileMenu,
    cases,
  } = useApp();

  const mobileOpen = propIsMobileOpen ?? isMobileMenuOpen;
  const handleCloseMobile = propOnCloseMobile ?? closeMobileMenu;

  const isAdmin = currentUser.role === 'ADMINISTRATOR';

  // Count active queue items
  const openQueueCount = cases.filter(
    (c) => c.workflowStatus !== 'VERIFIED'
  ).length;

  const discrepanciesCount = cases.filter(
    (c) => c.workflowStatus === 'CONTRADICTED' || c.discrepanciesCount > 0
  ).length;

  const navItems: Array<{
    id: string;
    route: AppRoute;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    adminOnly?: boolean;
  }> = [
    {
      id: 'nav-dashboard',
      route: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'nav-candidates',
      route: 'candidates',
      label: 'Candidates',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'nav-queue',
      route: 'queue',
      label: 'Verification Queue',
      icon: <ListTodo className="w-4 h-4" />,
      badge: openQueueCount,
      badgeColor: 'bg-[#B7791F]',
    },
    {
      id: 'nav-cases',
      route: 'case-overview',
      label: 'Case Overview',
      icon: <FolderKanban className="w-4 h-4" />,
    },
    {
      id: 'nav-workbench',
      route: 'workbench',
      label: 'Document Review',
      icon: <FileSearch className="w-4 h-4" />,
    },
    {
      id: 'nav-discrepancies',
      route: 'discrepancies',
      label: 'Discrepancy Review',
      icon: <Scale className="w-4 h-4" />,
      badge: discrepanciesCount,
      badgeColor: 'bg-[#B83232]',
    },
    {
      id: 'nav-source-checks',
      route: 'source-checks',
      label: 'Source Checks',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'nav-reports',
      route: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'nav-gazette',
      route: 'gazette',
      label: 'Gazette Publication',
      icon: <Newspaper className="w-4 h-4" />,
      badge: 'PROV',
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'nav-audit-trail',
      route: 'audit-trail',
      label: 'Audit Trail',
      icon: <ScrollText className="w-4 h-4" />,
    },
    // Admin only
    {
      id: 'nav-config',
      route: 'configuration',
      label: 'Configuration',
      icon: <Settings className="w-4 h-4" />,
      adminOnly: true,
    },
    {
      id: 'nav-users',
      route: 'user-management',
      label: 'User Management',
      icon: <UserCog className="w-4 h-4" />,
      adminOnly: true,
    },
  ];

  const handleNavClick = (route: AppRoute) => {
    navigateTo(route);
    if (handleCloseMobile) handleCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#17324D] text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-white/10 bg-[#12283E]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shrink-0 shadow-sm">
            <div className="w-4 h-4 border-2 border-[#17324D] rotate-45" />
          </div>
          {(!isSidebarCollapsed || mobileOpen) && (
            <div className="truncate">
              <span className="text-white font-bold tracking-tight text-base block">
                CredentialVerify
              </span>
              <span className="text-[10px] uppercase font-semibold text-white/50 tracking-widest block">
                Electoral Commission
              </span>
            </div>
          )}
        </div>

        {/* Mobile close or desktop collapse */}
        {mobileOpen ? (
          <button
            type="button"
            onClick={handleCloseMobile}
            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#16838D]"
            title={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Primary Nav List */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-6" aria-label="Main Navigation">
        {/* Main Menu Section */}
        <div>
          {(!isSidebarCollapsed || mobileOpen) && (
            <div className="px-5 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">
              Main Menu
            </div>
          )}
          <div className="space-y-0.5">
            {navItems.filter((i) => !i.adminOnly).map((item) => {
              const isActive = currentRoute === item.route;
              const badgeValue = typeof item.badge === 'number' ? item.badge : 0;

              return (
                <button
                  key={item.id}
                  id={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.route)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors group focus:outline-none ${
                    isActive
                      ? 'bg-[#2F75B5] text-white border-r-4 border-[#16838D] font-semibold'
                      : 'text-white/70 hover:bg-[#2F75B5]/60 hover:text-white'
                  }`}
                  title={isSidebarCollapsed && !mobileOpen ? item.label : undefined}
                >
                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                    {item.icon}
                  </span>

                  {(!isSidebarCollapsed || mobileOpen) && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {(!isSidebarCollapsed || mobileOpen) && badgeValue > 0 && (
                    <span
                      className={`text-[10px] font-tabular font-bold px-2 py-0.5 rounded-full text-white ${
                        item.badgeColor || 'bg-slate-700'
                      }`}
                    >
                      {badgeValue}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Administration Section */}
        {isAdmin && (
          <div>
            {(!isSidebarCollapsed || mobileOpen) && (
              <div className="px-5 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">
                Administration
              </div>
            )}
            <div className="space-y-0.5">
              {navItems.filter((i) => i.adminOnly).map((item) => {
                const isActive = currentRoute === item.route;

                return (
                  <button
                    key={item.id}
                    id={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.route)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors group focus:outline-none ${
                      isActive
                        ? 'bg-[#2F75B5] text-white border-r-4 border-[#16838D] font-semibold'
                        : 'text-white/70 hover:bg-[#2F75B5]/60 hover:text-white'
                    }`}
                    title={isSidebarCollapsed && !mobileOpen ? item.label : undefined}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                      {item.icon}
                    </span>

                    {(!isSidebarCollapsed || mobileOpen) && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer Role & Environment Notice */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-[#12283E]">
        {(!isSidebarCollapsed || mobileOpen) ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#16838D] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-white/50 truncate">
                {currentUser.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-[#16838D] flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`fixed top-0 bottom-0 left-0 z-40 transition-all duration-200 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {navContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
