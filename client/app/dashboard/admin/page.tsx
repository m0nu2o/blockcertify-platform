"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Activity, AlertTriangle, ShieldCheck, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard-shell';
import {
  DashboardMetricCard,
  DashboardSection,
  DashboardStateCard,
  EmptyListState,
  RetryButton,
  StatusBadge,
} from '@/components/dashboard/dashboard-primitives';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { BulkCertificateUploadForm } from '@/components/forms/bulk-certificate-upload-form';
import { apiFetch } from '@/lib/api';
import { formatNumber, cn } from '@/lib/utils';

type ApiResponse<T> = { success: boolean; message: string; data: T };

type AdminAnalytics = {
  stats: {
    certificatesIssued: number;
    certificatesVerified: number;
    certificatesRevoked: number;
    institutions: number;
    students: number;
    transactions: number;
  };
  institutionRankings: Array<{
    _id: string;
    name: string;
    stats: { certificatesIssued: number; certificatesRevoked: number; studentsManaged: number };
  }>;
  trafficAnalytics: Array<{ _id: number; count: number }>;
};

type AuditLog = {
  _id: string;
  action: string;
  actorEmail?: string;
  entity?: string;
  createdAt: string;
};

type BlockchainTransaction = {
  _id: string;
  action: string;
  transactionHash: string;
  status: string;
  gasUsed?: string;
  createdAt?: string;
};

type Institution = {
  _id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  stats?: { certificatesIssued?: number; certificatesRevoked?: number; studentsManaged?: number };
};

type VerificationLogEntry = {
  _id: string;
  certificateId: string;
  method: string;
  valid: boolean;
  createdAt: string;
};

type PaginatedData<T> = { items: T[]; total: number; page: number; limit: number };
type MaybePaginated<T> = T[] | PaginatedData<T>;

function extractItems<T>(payload: MaybePaginated<T> | undefined | null): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object' && 'items' in payload && Array.isArray((payload as PaginatedData<T>).items)) {
    return (payload as PaginatedData<T>).items;
  }
  return [];
}

type SubscriptionRequest = {
  _id: string;
  user?: { _id: string; name: string; email: string; role: string };
  institution?: { _id: string; name: string; email: string };
  tier: 'free' | 'Starter' | 'Growth' | 'Enterprise';
  status: 'pending' | 'active' | 'rejected' | 'expired' | 'cancelled';
  requestedAt: string;
  approvedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  approvedBy?: { _id: string; name: string; email: string };
};

type AdminDashboardData = {
  analytics: AdminAnalytics;
  auditLogs: AuditLog[];
  transactions: BlockchainTransaction[];
  institutions: Institution[];
  verificationLogs: VerificationLogEntry[];
  subscriptions: SubscriptionRequest[];
  pendingSubscriptionCount: number;
};

type BulkVerifyResult = {
  certificateId: string;
  success: boolean;
  data?: { valid: boolean };
  error?: string;
};

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionActionId, setInstitutionActionId] = useState<string | null>(null);
  const [subscriptionActionId, setSubscriptionActionId] = useState<string | null>(null);
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [bulkVerifyInput, setBulkVerifyInput] = useState('');
  const [bulkVerifyLoading, setBulkVerifyLoading] = useState(false);
  const [bulkVerifyResults, setBulkVerifyResults] = useState<BulkVerifyResult[] | null>(null);
  const [reconciling, setReconciling] = useState(false);

  const handleReconcile = async () => {
    if (!session?.user.accessToken) return;
    setReconciling(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string; data?: { reconciledCount: number; pendingCount: number } }>(
        '/admin/reconcile',
        { method: 'POST', token: session.user.accessToken }
      );
      toast.success(res.message || 'Reconciliation completed successfully.');
      await loadDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reconciliation failed.');
    } finally {
      setReconciling(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    if (!session?.user.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [
        analyticsResponse,
        auditLogsResponse,
        transactionsResponse,
        institutionsResponse,
        verificationLogsResponse,
        subscriptionsResponse,
      ] = await Promise.all([
        apiFetch<ApiResponse<AdminAnalytics>>('/analytics/admin', { token: session.user.accessToken }),
        apiFetch<ApiResponse<MaybePaginated<AuditLog>>>('/admin/audit-logs', { token: session.user.accessToken }),
        apiFetch<ApiResponse<MaybePaginated<BlockchainTransaction>>>('/admin/blockchain-transactions', { token: session.user.accessToken }),
        apiFetch<ApiResponse<MaybePaginated<Institution>>>('/admin/institutions', { token: session.user.accessToken }),
        apiFetch<ApiResponse<MaybePaginated<VerificationLogEntry>>>('/admin/verification-logs', { token: session.user.accessToken }),
        apiFetch<ApiResponse<{ items: SubscriptionRequest[]; total: number; pendingCount: number }>>('/admin/subscriptions', { token: session.user.accessToken }),
      ]);

      setData({
        analytics: analyticsResponse.data,
        auditLogs: extractItems(auditLogsResponse.data),
        transactions: extractItems(transactionsResponse.data),
        institutions: extractItems(institutionsResponse.data),
        verificationLogs: extractItems(verificationLogsResponse.data),
        subscriptions: subscriptionsResponse.data?.items || [],
        pendingSubscriptionCount: subscriptionsResponse.data?.pendingCount || 0,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [session?.user.accessToken]);

  const approveInstitution = useCallback(
    async (institutionId: string) => {
      if (!session?.user.accessToken) return;
      setInstitutionActionId(institutionId);
      try {
        await apiFetch(`/admin/institutions/${institutionId}/approve`, { method: 'PATCH', token: session.user.accessToken });
        toast.success('Institution approved');
        await loadDashboard();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : 'Failed to approve institution');
      } finally {
        setInstitutionActionId(null);
      }
    },
    [session?.user.accessToken, loadDashboard]
  );

  const suspendInstitution = useCallback(
    async (institutionId: string) => {
      if (!session?.user.accessToken) return;
      const reason = window.prompt('Reason for suspending this institution (min 5 characters):');
      if (!reason || reason.trim().length < 5) {
        if (reason !== null) toast.error('Suspension reason must be at least 5 characters.');
        return;
      }

      setInstitutionActionId(institutionId);
      try {
        await apiFetch(`/admin/institutions/${institutionId}/suspend`, {
          method: 'PATCH',
          token: session.user.accessToken,
          body: JSON.stringify({ reason: reason.trim() }),
        });
        toast.success('Institution suspended');
        await loadDashboard();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : 'Failed to suspend institution');
      } finally {
        setInstitutionActionId(null);
      }
    },
    [session?.user.accessToken, loadDashboard]
  );

  const approveSubscription = useCallback(
    async (subscriptionId: string) => {
      if (!session?.user.accessToken) return;
      setSubscriptionActionId(subscriptionId);
      try {
        await apiFetch(`/admin/subscriptions/${subscriptionId}/approve`, {
          method: 'POST',
          token: session.user.accessToken,
        });
        toast.success('Subscription approved successfully. Plan activated.');
        await loadDashboard();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : 'Failed to approve subscription');
      } finally {
        setSubscriptionActionId(null);
      }
    },
    [session?.user.accessToken, loadDashboard]
  );

  const rejectSubscription = useCallback(
    async (subscriptionId: string) => {
      if (!session?.user.accessToken) return;
      const reason = window.prompt('Reason for rejecting this subscription request (optional):');
      if (reason === null) return;

      setSubscriptionActionId(subscriptionId);
      try {
        await apiFetch(`/admin/subscriptions/${subscriptionId}/reject`, {
          method: 'POST',
          token: session.user.accessToken,
          body: JSON.stringify({ reason: reason.trim() || undefined }),
        });
        toast.success('Subscription request rejected');
        await loadDashboard();
      } catch (actionError) {
        toast.error(actionError instanceof Error ? actionError.message : 'Failed to reject subscription');
      } finally {
        setSubscriptionActionId(null);
      }
    },
    [session?.user.accessToken, loadDashboard]
  );

  const runBulkVerify = useCallback(async () => {
    if (!session?.user.accessToken) return;
    const certificateIds = bulkVerifyInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (certificateIds.length === 0) {
      toast.error('Enter at least one certificate ID.');
      return;
    }

    setBulkVerifyLoading(true);
    setBulkVerifyResults(null);
    try {
      const response = await apiFetch<ApiResponse<BulkVerifyResult[]>>('/verification/bulk', {
        method: 'POST',
        token: session.user.accessToken,
        body: JSON.stringify({ certificateIds }),
      });
      setBulkVerifyResults(response.data);
    } catch (verifyError) {
      toast.error(verifyError instanceof Error ? verifyError.message : 'Bulk verification failed');
    } finally {
      setBulkVerifyLoading(false);
    }
  }, [bulkVerifyInput, session?.user.accessToken]);

  useEffect(() => {
    if (status === 'authenticated') {
      void loadDashboard();
      return;
    }

    if (status === 'unauthenticated') {
      setLoading(false);
      setError('You need to sign in to load the admin dashboard.');
    }
  }, [loadDashboard, status]);

  const handleExportCsv = () => {
    if (!data?.auditLogs?.length) {
      toast.error('No audit logs available to export.');
      return;
    }
    const headers = ['ID', 'Action', 'Actor Email', 'Entity', 'Date'];
    const rows = (data.auditLogs ?? []).map(log => [
      log._id,
      log.action,
      log.actorEmail || 'System actor',
      log.entity || 'Unknown entity',
      new Date(log.createdAt).toLocaleString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(f => `"${f}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported as CSV.');
  };

  const handleExportPdf = async () => {
    if (!data?.auditLogs?.length) {
      toast.error('No audit logs available to export.');
      return;
    }
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    doc.text('BlockCertify - System Audit Logs', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    autoTable(doc, {
      startY: 30,
      head: [['Action', 'Actor Email', 'Entity', 'Date']],
      body: (data.auditLogs ?? []).map(log => [
        log.action,
        log.actorEmail || 'System actor',
        log.entity || 'Unknown entity',
        new Date(log.createdAt).toLocaleString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`Audit_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Audit logs exported as PDF.');
  };

  if (loading) {
    return (
      <DashboardShell title="Admin Dashboard">
        <DashboardStateCard
          variant="loading"
          title="Loading admin operations"
          description="Collecting platform-wide analytics, blockchain write activity, and audit visibility."
        />
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell title="Admin Dashboard">
        <DashboardStateCard
          variant="error"
          title="Unable to load admin console"
          description={error}
          action={
            <div className="flex items-center gap-3">
              <RetryButton onClick={() => void loadDashboard()} />
              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Sign In
                </Button>
              </Link>
            </div>
          }
        />
      </DashboardShell>
    );
  }

  if (!data) {
    return (
      <DashboardShell title="Admin Dashboard">
        <DashboardStateCard
          title="No admin telemetry yet"
          description="Once users, certificates, and audit events exist, this page will surface platform-wide governance insights."
        />
      </DashboardShell>
    );
  }

  const peakTraffic = data.analytics.trafficAnalytics.reduce((max, item) => Math.max(max, item.count), 0);

  return (
    <DashboardShell title="Admin Dashboard">
      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-[30px] border border-border/12 bg-gradient-to-br from-success/10 via-foreground/[0.04] to-transparent p-6 shadow-glass backdrop-blur-2xl">
          <div className="inline-flex rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-success">
            Governance command center
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Monitor issuance growth, blockchain writes, and privileged activity from one secure view.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/65">
            The platform currently tracks {formatNumber(data.analytics.stats.institutions)} institutions, {formatNumber(data.analytics.stats.students)} students, and {formatNumber(data.analytics.stats.transactions)} recorded blockchain write operations.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="text-sm text-foreground/55">Peak traffic bucket</div>
              <div className="mt-2 text-2xl font-semibold">{formatNumber(peakTraffic)}</div>
            </div>
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="text-sm text-foreground/55">Verified records</div>
              <div className="mt-2 text-2xl font-semibold">{formatNumber(data.analytics.stats.certificatesVerified)}</div>
            </div>
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="text-sm text-foreground/55">Revoked records</div>
              <div className="mt-2 text-2xl font-semibold">{formatNumber(data.analytics.stats.certificatesRevoked)}</div>
            </div>
          </div>
        </div>
        <DashboardSection title="Admin posture" description="Immediate signals for governance and operational review.">
          <div className="grid gap-3 text-sm text-foreground/70">
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-4 text-success" /> Public verification is gas-free</div>
              <div className="mt-2 text-foreground/65">Verification routes remain read-only while only issuance, updates, and revocations create blockchain transaction logs.</div>
            </div>
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground"><AlertTriangle className="size-4 text-warning" /> Privileged events are auditable</div>
              <div className="mt-2 text-foreground/65">Recent audit logs below expose the latest actions taken by authenticated users for quick forensic review.</div>
            </div>
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground"><Activity className="size-4 text-accent" /> Top institutions are ranked live</div>
              <div className="mt-2 text-foreground/65">Institution rankings, issuance totals, and student counts highlight concentration and adoption in the network.</div>
            </div>
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardMetricCard
          label="Certificates issued"
          value={data.analytics.stats.certificatesIssued}
          caption="Total records created across all institutions."
          badge="platform"
        />
        <DashboardMetricCard
          label="Verified certificates"
          value={data.analytics.stats.certificatesVerified}
          caption="Successfully verified certificates without public on-chain writes."
        />
        <DashboardMetricCard
          label="Pending plans"
          value={data.pendingSubscriptionCount ?? 0}
          caption="Plan requests awaiting admin review and activation."
          badge="billing"
        />
        <DashboardMetricCard
          label="Institutions"
          value={data.analytics.stats.institutions}
          caption="Institution accounts represented in the registry."
        />
        <DashboardMetricCard
          label="Transactions"
          value={data.analytics.stats.transactions}
          caption="Tracked blockchain issue, update, and revoke operations."
        />
      </div>

      <DashboardSection title="Institutions" description="Approve pending institutions or suspend ones that need to be paused.">
        {(data.institutions ?? []).length === 0 ? (
          <EmptyListState title="No institutions yet" description="Institutions will appear here once they register." />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/12 scrollbar-thin">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-foreground/[0.05] text-foreground/60">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Institution</th>
                  <th className="px-4 py-3 whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Issued</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.institutions ?? []).map((institution) => (
                  <tr key={institution._id} className="border-t border-border/10 bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-colors duration-150 cursor-default">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{institution.name}</td>
                    <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">{institution.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={institution.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatNumber(institution.stats?.certificatesIssued ?? 0)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={institutionActionId === institution._id || institution.status === 'approved'}
                          onClick={() => void approveInstitution(institution._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={institutionActionId === institution._id || institution.status === 'suspended'}
                          onClick={() => void suspendInstitution(institution._id)}
                        >
                          Suspend
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        title="Subscription Requests"
        description={`Review plan requests from institutions and students (${data.pendingSubscriptionCount || 0} pending approval). Approving immediately activates the plan and updates feature limits.`}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex gap-1.5 p-1 rounded-2xl bg-foreground/[0.04] border border-border/10">
            {(['all', 'pending', 'active', 'rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSubscriptionFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  subscriptionFilter === filter
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {filter}
                {filter === 'pending' && data.pendingSubscriptionCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                    {data.pendingSubscriptionCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {((data.subscriptions ?? []).filter((sub) => subscriptionFilter === 'all' || sub.status === subscriptionFilter)).length === 0 ? (
          <EmptyListState
            title="No subscription requests found"
            description={
              subscriptionFilter === 'pending'
                ? 'There are currently no pending plan upgrade requests.'
                : 'Subscription requests from users will appear here.'
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/12 scrollbar-thin">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-foreground/[0.05] text-foreground/60">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">User</th>
                  <th className="px-4 py-3 whitespace-nowrap">Institution</th>
                  <th className="px-4 py-3 whitespace-nowrap">Requested Plan</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.subscriptions ?? [])
                  .filter((sub) => subscriptionFilter === 'all' || sub.status === subscriptionFilter)
                  .map((sub) => (
                    <tr
                      key={sub._id}
                      className="border-t border-border/10 bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-colors duration-150 cursor-default"
                    >
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        <div>{sub.user?.name || 'Unknown User'}</div>
                        <div className="text-xs text-foreground/50">{sub.user?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground/80 whitespace-nowrap">
                        {sub.institution?.name || 'Individual / None'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            sub.tier === 'Enterprise'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : sub.tier === 'Growth'
                              ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                              : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {sub.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={sub.status} />
                        {sub.status === 'rejected' && sub.rejectionReason && (
                          <div className="text-[11px] text-danger/80 mt-0.5 max-w-[200px] truncate" title={sub.rejectionReason}>
                            Reason: {sub.rejectionReason}
                          </div>
                        )}
                        {sub.status === 'active' && sub.expiresAt && (
                          <div className="text-[11px] text-foreground/50 mt-0.5">
                            Exp: {new Date(sub.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground/60 whitespace-nowrap">
                        {new Date(sub.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sub.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={subscriptionActionId === sub._id}
                              onClick={() => void approveSubscription(sub._id)}
                              className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={subscriptionActionId === sub._id}
                              onClick={() => void rejectSubscription(sub._id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/40 italic">
                            {sub.status === 'active' ? 'Active' : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <BulkCertificateUploadForm
          accessToken={session?.user?.accessToken}
          institutions={(data.institutions ?? []).map((institution) => ({ _id: institution._id, name: institution.name }))}
          onCompleted={() => void loadDashboard()}
        />

        <GlassCard>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Bulk verify certificates</h3>
            <p className="mt-1 text-sm text-foreground/65">Paste one certificate ID per line to check many certificates at once.</p>
          </div>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-border/15 bg-foreground/[0.03] p-3 text-sm text-foreground placeholder:text-foreground/45 outline-none transition focus:border-accent/60 focus:bg-foreground/[0.05] focus:ring-2 focus:ring-accent/20"
            placeholder={'BC-1A2B3C4D\nBC-5E6F7A8B'}
            value={bulkVerifyInput}
            onChange={(event) => setBulkVerifyInput(event.target.value)}
            aria-label="Bulk verify certificate IDs"
          />
          <div className="mt-3">
            <Button disabled={bulkVerifyLoading} onClick={() => void runBulkVerify()}>
              {bulkVerifyLoading ? 'Verifying...' : 'Verify all'}
            </Button>
          </div>
          {bulkVerifyResults ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border/12 scrollbar-thin">
              <table className="w-full text-left text-sm min-w-[400px]">
                <thead className="bg-foreground/[0.05] text-foreground/60">
                  <tr>
                    <th className="px-4 py-2 whitespace-nowrap">Certificate ID</th>
                    <th className="px-4 py-2 whitespace-nowrap">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkVerifyResults.map((result, index) => (
                    <tr key={`${result.certificateId}-${index}`} className="border-t border-border/10 bg-foreground/[0.02]">
                      <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{result.certificateId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {result.success && result.data?.valid ? (
                          <span className="text-success">Valid</span>
                        ) : result.success ? (
                          <span className="text-danger">Invalid</span>
                        ) : (
                          <span className="text-danger">{result.error || 'Not found'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Institution rankings" description="Leaders by issuance volume, with student coverage and revocation counts.">
          {(data.analytics?.institutionRankings ?? []).length === 0 ? (
            <EmptyListState
              title="No institution rankings yet"
              description="Rankings will appear after institutions begin issuing certificates on the platform."
            />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-border/12 scrollbar-thin">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="bg-foreground/[0.05] text-foreground/60">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Institution</th>
                    <th className="px-4 py-3 whitespace-nowrap">Issued</th>
                    <th className="px-4 py-3 whitespace-nowrap">Revoked</th>
                    <th className="px-4 py-3 whitespace-nowrap">Students</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.analytics?.institutionRankings ?? []).slice(0, 6).map((item) => (
                    <tr key={item._id} className="border-t border-border/10 bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-colors duration-150 cursor-default">
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{item.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatNumber(item.stats?.certificatesIssued ?? 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatNumber(item.stats?.certificatesRevoked ?? 0)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatNumber(item.stats?.studentsManaged ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardSection>

        <DashboardSection 
          title="Recent blockchain transactions" 
          description="Latest write operations recorded by the backend."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={reconciling}
                onClick={() => void handleReconcile()}
                className="gap-1.5 text-xs border-accent/30 text-accent hover:bg-accent/10"
              >
                <RefreshCw className={cn("size-3.5", reconciling && "animate-spin")} />
                {reconciling ? 'Reconciling...' : 'Reconcile Sync'}
              </Button>
              <Button variant="secondary" size="sm">Last 5</Button>
            </div>
          }
        >
          {(data.transactions ?? []).length === 0 ? (
            <EmptyListState
              title="No blockchain transactions recorded"
              description="Write operations appear here after issuance, updates, or revocations are submitted."
            />
          ) : (
            <div className="grid gap-4 text-sm text-foreground/70">
              {(data.transactions ?? []).slice(0, 5).map((item) => (
                <div key={item._id} className="rounded-3xl border border-border/12 bg-foreground/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold capitalize text-foreground">{item.action}</div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 break-all text-xs text-foreground/60">{item.transactionHash}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-foreground/55">
                    <span>{item.gasUsed ? `${item.gasUsed} gas` : 'Gas not recorded'}</span>
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent activity'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      <DashboardSection 
        title="Recent audit logs" 
        description="The newest authenticated actions recorded for governance review."
        action={
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-border/12 bg-foreground/[0.04] px-4 text-xs font-semibold text-foreground/80 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              aria-label="Export audit logs to CSV"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-border/12 bg-foreground/[0.04] px-4 text-xs font-semibold text-foreground/80 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
              aria-label="Export audit logs to PDF"
            >
              Export PDF
            </button>
          </div>
        }
      >
        {(data.auditLogs ?? []).length === 0 ? (
          <EmptyListState
            title="No audit logs available"
            description="Audit events will appear here after users start authenticating and performing tracked actions."
          />
        ) : (
          <div className="grid gap-4 text-sm text-foreground/70 md:grid-cols-2">
            {(data.auditLogs ?? []).slice(0, 8).map((log) => (
              <div key={log._id} className="rounded-3xl border border-border/12 bg-foreground/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{log.action}</div>
                    <div className="mt-1 text-foreground/65">{log.actorEmail || 'System actor'} · {log.entity || 'Unknown entity'}</div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/12 bg-foreground/[0.05] px-3 py-1 text-xs text-foreground/60">
                    <TrendingUp className="size-3.5" /> Logged
                  </div>
                </div>
                <div className="mt-3 text-xs text-foreground/50">{new Date(log.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Recent verification attempts" description="The newest certificate verification checks, across every method.">
        {(data.verificationLogs ?? []).length === 0 ? (
          <EmptyListState
            title="No verification attempts yet"
            description="Verification attempts will appear here once certificates start being checked."
          />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/12 scrollbar-thin">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-foreground/[0.05] text-foreground/60">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Certificate ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">Method</th>
                  <th className="px-4 py-3 whitespace-nowrap">Result</th>
                  <th className="px-4 py-3 whitespace-nowrap">When</th>
                </tr>
              </thead>
              <tbody>
                {(data.verificationLogs ?? []).slice(0, 10).map((log) => (
                  <tr key={log._id} className="border-t border-border/10 bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-colors duration-150 cursor-default">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{log.certificateId}</td>
                    <td className="px-4 py-3 capitalize text-foreground/70 whitespace-nowrap">{log.method}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.valid ? <span className="text-success">Valid</span> : <span className="text-danger">Invalid</span>}</td>
                    <td className="px-4 py-3 text-xs text-foreground/55 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>
    </DashboardShell>
  );
}
