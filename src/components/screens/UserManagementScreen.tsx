import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, UserAccount } from '../../types';
import { Users, UserPlus, Shield, Key, Mail, CheckCircle2, MoreVertical } from 'lucide-react';

export const UserManagementScreen: React.FC = () => {
  const { addToast } = useApp();
  const [users, setUsers] = useState<UserAccount[]>([]);

  const handleToggleActive = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
    addToast('Staff access credentials status updated.', 'info');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#17202A]">Authorized Personnel & Role Access (RBAC)</h2>
          <p className="text-xs text-[#5B6777] mt-0.5">
            Manage electoral commission staff authorizations, access scopes, and cryptographic credential statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => addToast('User invitation workflow opened.', 'info')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#17324D] hover:bg-[#0f2337] rounded-md shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision Authorized Staff</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[#5B6777] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Jurisdiction Scope</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#17202A] text-sm">{user.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{user.email}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-[#17202A]">
                    {user.staffId}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200">
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {user.jurisdiction}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-max ${
                        user.isActive
                          ? 'bg-[#237A57]/10 text-[#237A57]'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-[#237A57]' : 'bg-red-600'}`} />
                      {user.isActive ? 'Active Staff' : 'Suspended'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(user.id)}
                      className="text-xs text-[#2F75B5] hover:underline font-semibold"
                    >
                      {user.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
