import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ShieldCheck,
  RefreshCw,
  Plus,
  Key,
  UserCheck,
  UserX,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  Mail,
} from '../icons';
import { AdminUserListItem, UserRole, AccountStatus } from '../../types/auth';

interface AdminUsersViewProps {
  onBackToWorkspace?: () => void;
}

const TENANT_REGISTRY_STORAGE_KEY = 'deltaharvest_admin_tenants_registry';

function getLocalTenantRegistry(): AdminUserListItem[] {
  try {
    const raw = localStorage.getItem(TENANT_REGISTRY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveLocalTenantRegistry(items: AdminUserListItem[]) {
  try {
    localStorage.setItem(TENANT_REGISTRY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function normalizeUserItem(raw: any): AdminUserListItem {
  const isAct =
    raw.status === 'ACTIVE' ||
    raw.is_active === 1 ||
    raw.is_active === true ||
    raw.isActive === true;
  return {
    id: String(raw.id || raw.userId || `user-${Date.now()}`),
    email: String(raw.email || '').toLowerCase(),
    role: (raw.role ? String(raw.role).toUpperCase() : 'CLIENT') as UserRole,
    status: isAct ? 'ACTIVE' : 'SUSPENDED',
    displayName: String(
      raw.displayName || raw.display_name || (raw.email ? raw.email.split('@')[0] : 'User')
    ),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    lastLoginAt: raw.lastLoginAt || raw.last_login_at || null,
    tradeCount:
      typeof raw.tradeCount === 'number'
        ? raw.tradeCount
        : typeof raw.trade_count === 'number'
        ? raw.trade_count
        : 0,
    watchlistCount: typeof raw.watchlistCount === 'number' ? raw.watchlistCount : 0,
  };
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onBackToWorkspace }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>(() => getLocalTenantRegistry());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<AdminUserListItem | null>(null);

  // Create User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CLIENT');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password Form State
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Admin Settings State
  const [activeTab, setActiveTab] = useState<'USERS' | 'SETTINGS'>('USERS');
  const [adminNotificationEmail, setAdminNotificationEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSaveSuccess, setEmailSaveSuccess] = useState(false);
  const [emailSaveError, setEmailSaveError] = useState<string | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const serverNormalized = data.users.map(normalizeUserItem);
          const localList = getLocalTenantRegistry();

          const map = new Map<string, AdminUserListItem>();
          for (const u of serverNormalized) {
            map.set(u.id, u);
            map.set(u.email, u);
          }

          const combined = [...serverNormalized];
          for (const loc of localList) {
            if (!map.has(loc.id) && !map.has(loc.email)) {
              combined.push(loc);
              map.set(loc.id, loc);
              map.set(loc.email, loc);
            }
          }

          setUsers(combined);
          saveLocalTenantRegistry(combined);
          return;
        }
      }
      const localFallback = getLocalTenantRegistry();
      if (localFallback.length > 0) {
        setUsers(localFallback);
      } else {
        setError('Unable to load user directory from server. Please verify administrator session.');
      }
    } catch {
      const localFallback = getLocalTenantRegistry();
      if (localFallback.length > 0) {
        setUsers(localFallback);
      } else {
        setError('Network error connecting to user administration service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.adminNotificationEmail) {
          setAdminNotificationEmail(data.adminNotificationEmail);
        }
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, [fetchUsers, fetchSettings]);

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setEmailSaveError(null);
    setEmailSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ adminNotificationEmail: adminNotificationEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSaveSuccess(true);
        setTimeout(() => setEmailSaveSuccess(false), 3500);
      } else {
        setEmailSaveError(data.error || 'Failed to update admin notification email.');
      }
    } catch {
      setEmailSaveError('Network error updating admin notification email.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    const targetEmail = adminNotificationEmail.trim();
    if (!targetEmail) {
      setTestEmailResult({
        success: false,
        message: 'No administrator notification email configured. Please enter and save an email address above first.',
      });
      return;
    }
    setIsTestingEmail(true);
    setTestEmailResult(null);

    try {
      const subject = `[DeltaHarvest System Test] Administrator Email Alert Verified`;
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: subject,
          name: 'Platform Administrator',
          email: targetEmail,
          requestType: 'System Test',
          message: `This is a verified live test alert sent from the DeltaHarvest Tenant User Directory to confirm that email notifications arrive in ${targetEmail}.`,
          _captcha: 'false',
          _template: 'table',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success === true || data.success === 'true')) {
        setTestEmailResult({
          success: true,
          message: `✓ Test alert successfully delivered to ${targetEmail}! Check your inbox.`,
        });
      } else {
        setTestEmailResult({
          success: false,
          message: data.message || `Unable to send test alert to ${targetEmail}. Please check spam filter or settings.`,
        });
      }
    } catch {
      setTestEmailResult({
        success: false,
        message: `Network error dispatching test email alert to ${targetEmail}.`,
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    const emailVal = newEmail.trim().toLowerCase();
    const displayNameVal = newDisplayName.trim() || emailVal.split('@')[0];

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: emailVal,
          password: newPassword,
          displayName: displayNameVal,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        setNewEmail('');
        setNewPassword('');
        setNewDisplayName('');

        const createdItem: AdminUserListItem = {
          id: data.user?.id || `user-${Date.now()}`,
          email: emailVal,
          role: (newRole || 'CLIENT') as UserRole,
          status: 'ACTIVE',
          displayName: displayNameVal,
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
          tradeCount: 0,
          watchlistCount: 0,
        };

        setUsers((prev) => {
          const next = [createdItem, ...prev.filter((u) => u.email !== emailVal)];
          saveLocalTenantRegistry(next);
          return next;
        });

        await fetchUsers();
      } else {
        setCreateError(data.error || 'Failed to create user on server.');
      }
    } catch {
      setCreateError('Network error creating user account.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResetUser) return;
    setResetError(null);
    setIsResetting(true);

    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          userId: targetResetUser.id,
          email: targetResetUser.email,
          newPassword: resetPasswordVal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsResetModalOpen(false);
        setResetPasswordVal('');
        setTargetResetUser(null);
        await fetchUsers();
      } else {
        setResetError(data.error || 'Failed to reset password on server.');
      }
    } catch {
      setResetError('Network error resetting user password.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleStatus = async (targetUser: AdminUserListItem) => {
    const nextStatus: AccountStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to change status of ${targetUser.email} to ${nextStatus}?`;
    if (!confirm(confirmMsg)) return;

    // 1. Optimistic UI update and instant persistence
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u));
      saveLocalTenantRegistry(next);
      return next;
    });

    try {
      const res = await fetch('/api/admin/users/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          userId: targetUser.id,
          status: nextStatus,
          isActive: nextStatus === 'ACTIVE',
          email: targetUser.email,
        }),
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json().catch(() => ({}));
        console.warn('Server toggle returned notice, state maintained locally:', data);
      }
    } catch (err) {
      console.warn('Network sync notice during toggle, state maintained locally:', err);
    }
  };

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Multi-Tenant Administration Console</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  ADMIN ONLY
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Admin: {user?.email} • Cloudflare D1 Partitioned Database
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToWorkspace && (
            <button
              onClick={onBackToWorkspace}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition-colors"
            >
              Back to Workspace
            </button>
          )}
          <button
            onClick={fetchUsers}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Refresh user list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision New User</span>
          </button>
        </div>
      </div>

      {/* Console Section Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory &amp; Provisioning</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-200">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'SETTINGS'
              ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Notification &amp; Inquiry Settings</span>
        </button>
      </div>

      {activeTab === 'SETTINGS' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              <span>Admin Inquiries &amp; Notification Destination</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure the destination mailbox where prospective client inquiries, password reset requests, and maintenance support tickets are delivered.
            </p>
          </div>

          <form onSubmit={handleSaveEmail} className="max-w-xl space-y-4">
            {emailSaveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Notification email updated successfully. Subsequent inquiries will route to this address.</span>
              </div>
            )}
            {emailSaveError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{emailSaveError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Notification Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={adminNotificationEmail}
                  onChange={(e) => setAdminNotificationEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Stored server-side in Cloudflare D1 system settings with fallback to <code className="text-slate-400 font-mono">ADMIN_NOTIFICATION_EMAIL</code>. This value is never rendered to public or unauthenticated visitors.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSavingEmail}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Address...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Notification Settings</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isTestingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Sending Test Alert...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Send Test Alert Email</span>
                  </>
                )}
              </button>
            </div>

            {testEmailResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  testEmailResult.success
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                }`}
              >
                <span>{testEmailResult.message}</span>
                <button
                  type="button"
                  onClick={() => setTestEmailResult(null)}
                  className="text-slate-400 hover:text-white ml-2 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        <>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-white">{users.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Multi-tenant tenants</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Tenants</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-400">{activeCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Authorized to log in</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Suspended Accounts</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-rose-400">{suspendedCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Access revoked</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Security Engine</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-base font-bold font-mono text-cyan-300">Server PBKDF2</p>
          <p className="text-[11px] text-slate-400 mt-1">SameSite Session Auth</p>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Tenant User Directory</span>
              <span className="text-xs text-slate-400 font-mono">({users.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage accounts, issue temporary passwords, and control tenant authorizations.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading user directory...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/40 text-rose-300 text-xs">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No users registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">User / Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Trades</th>
                  <th className="py-3 px-4">Watchlist</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {users.map((u) => {
                  const isPrimaryAdmin = u.role === 'ADMIN' && users.filter((x) => x.role === 'ADMIN').length === 1;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white font-sans text-xs">{u.displayName}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{u.tradeCount ?? 0}</td>
                      <td className="py-3 px-4 text-slate-300">{u.watchlistCount ?? 0}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setTargetResetUser(u);
                            setIsResetModalOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Reset user password"
                        >
                          <Key className="w-3 h-3" />
                          <span>Reset Pwd</span>
                        </button>
                        {!isPrimaryAdmin && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 rounded text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50'
                                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Provision New User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Provision Client Account</span>
            </h3>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="client@investmentfirm.com"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Display Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Initial Password (min. 8 chars) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Temporary password"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CLIENT">CLIENT (Isolated Tenant Workspace)</option>
                  <option value="ADMIN">ADMIN (Full Console & Tool Management)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && targetResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <span>Reset Password for {targetResetUser.email}</span>
            </h3>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">New Password (min. 8 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new temporary password"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setTargetResetUser(null);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
