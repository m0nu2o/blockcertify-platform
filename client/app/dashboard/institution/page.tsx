"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Activity, Building2, ChevronRight, Copy, Check, GraduationCap, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard-shell';
import { CertificateIssuanceForm } from '@/components/forms/certificate-issuance-form';
import { BulkCertificateUploadForm } from '@/components/forms/bulk-certificate-upload-form';
import {
  DashboardMetricCard,
  DashboardSection,
  DashboardStateCard,
  EmptyListState,
  RetryButton,
  StatusBadge,
} from '@/components/dashboard/dashboard-primitives';
import { CertificateDetailModal } from '@/components/dashboard/certificate-detail-modal';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import type { Certificate } from '@/types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

type InstitutionAnalytics = {
  issued: number;
  revoked: number;
  students: number;
  recentCertificates: Certificate[];
};

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  createdAt?: string;
};

type CertificateListResponse = {
  items: Certificate[];
  total: number;
  page: number;
  limit: number;
};

type InstitutionDashboardData = {
  analytics: InstitutionAnalytics;
  certificates: CertificateListResponse;
  notifications: NotificationItem[];
};

export default function InstitutionDashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<InstitutionDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedForRevoke, setSelectedForRevoke] = useState<Set<string>>(new Set());
  const [revokingBulk, setRevokingBulk] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!session?.user.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [analyticsResponse, certificatesResponse, notificationsResponse] = await Promise.all([
        apiFetch<ApiResponse<InstitutionAnalytics>>('/analytics/institution', { token: session.user.accessToken }),
        apiFetch<ApiResponse<CertificateListResponse>>('/certificates?limit=6', { token: session.user.accessToken }),
        apiFetch<ApiResponse<NotificationItem[]>>('/notifications', { token: session.user.accessToken }),
      ]);

      setData({
        analytics: analyticsResponse.data,
        certificates: certificatesResponse.data,
        notifications: notificationsResponse.data,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load institution dashboard');
    } finally {
      setLoading(false);
    }
  }, [session?.user.accessToken]);

  const revokeCertificate = useCallback(async (certId: string) => {
    if (!session?.user.accessToken) return;
    const reason = window.prompt('Reason for revoking this certificate (min 5 characters):');
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) toast.error('Revocation reason must be at least 5 characters.');
      return;
    }
    setRevoking(certId);
    try {
      await apiFetch(`/certificates/${certId}/revoke`, {
        method: 'PATCH',
        token: session.user.accessToken,
        body: JSON.stringify({ reason: reason.trim() }),
      });
      toast.success('Certificate revoked successfully.');
      await loadDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke certificate');
    } finally {
      setRevoking(null);
    }
  }, [session?.user.accessToken, loadDashboard]);

  const revokeBulk = useCallback(async () => {
    if (!session?.user.accessToken || selectedForRevoke.size === 0) return;
    const reason = window.prompt(`Reason for revoking ${selectedForRevoke.size} certificates (min 5 characters):`);
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) toast.error('Revocation reason must be at least 5 characters.');
      return;
    }
    setRevokingBulk(true);
    try {
      await apiFetch(`/certificates/bulk/revoke`, {
        method: 'POST',
        token: session.user.accessToken,
        body: JSON.stringify({ certificateIds: Array.from(selectedForRevoke), reason: reason.trim() }),
      });
      toast.success('Certificates revoked successfully.');
      setSelectedForRevoke(new Set());
      await loadDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke certificates');
    } finally {
      setRevokingBulk(false);
    }
  }, [session?.user.accessToken, loadDashboard, selectedForRevoke]);

  const copyCertId = async (certId: string) => {
    await navigator.clipboard.writeText(certId);
    setCopiedId(certId);
    toast.success('Certificate ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async (type: 'csv' | 'pdf') => {
    if (!session?.user.accessToken) return;
    const toastId = toast.loading(`Generating ${type.toUpperCase()}...`);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/certificates/exports/${type}`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${type.toUpperCase()} exported successfully!`, { id: toastId });
    } catch (err) {
      toast.error('Failed to export certificates', { id: toastId });
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      void loadDashboard();
      return;
    }

    if (status === 'unauthenticated') {
      setLoading(false);
      setError('You need to sign in to load the institution dashboard.');
    }
  }, [loadDashboard, status]);

  const institutionStatus = session?.user?.institutionStatus;

  return (
    <DashboardShell title="Institution Dashboard">
      {institutionStatus && institutionStatus !== 'approved' ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm text-warning">
          {institutionStatus === 'pending'
            ? 'Your institution is pending admin approval. You can browse your dashboard, but certificate issuance is disabled until an administrator approves your account.'
            : institutionStatus === 'suspended'
              ? 'Your institution has been suspended. Certificate issuance is disabled. Contact platform support for details.'
              : 'Your institution registration was not approved. Certificate issuance is disabled.'}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="grid gap-6">
          <CertificateIssuanceForm onCompleted={() => void loadDashboard()} />
          <BulkCertificateUploadForm
            accessToken={session?.user?.accessToken}
            onCompleted={() => void loadDashboard()}
            disabled={institutionStatus !== undefined && institutionStatus !== 'approved'}
          />
        </div>
        <div className="grid gap-6">
          {loading ? (
            <DashboardStateCard
              variant="loading"
              title="Loading institution analytics"
              description="Fetching issuance, revocation, student coverage, and certificate activity for your institution."
            />
          ) : error ? (
            <DashboardStateCard
              variant="error"
              title="Unable to load institution workspace"
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
          ) : !data ? (
            <DashboardStateCard
              title="No institution data yet"
              description="As soon as your institution issues certificates, this workspace will show analytics, recent activity, and notifications."
            />
          ) : (
            <>
              <div className="rounded-2xl border border-border/12 bg-gradient-to-br from-accent/12 via-foreground/[0.04] to-transparent p-6 shadow-glass backdrop-blur-2xl">
                <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  Institution Operations
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground leading-snug">Track credential lifecycle analytics</h2>
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                  Monitor certificate issuances, track student coverage, and coordinate revoked records across the secure registry.
                </p>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <DashboardMetricCard
                  label="Issued"
                  value={data.analytics.issued}
                  caption="Certificates recorded by this institution."
                />
                <DashboardMetricCard
                  label="Revoked"
                  value={data.analytics.revoked}
                  caption="Records intentionally invalidated by authorized actors."
                />
                <DashboardMetricCard
                  label="Students"
                  value={data.analytics.students}
                  caption="Students covered by the institution's certificate activity."
                />
              </div>

              <DashboardSection title="Operational posture" description="A quick read on how this institution can safely issue and manage credentials.">
                <div className="grid gap-3 text-sm text-foreground/70">
                  <div className="rounded-xl border border-border/10 bg-foreground/[0.02] p-5 hover:border-accent/20 transition-colors">
                    <div className="flex items-center gap-3 font-semibold text-foreground">
                      <div className="p-2 rounded-xl bg-success/10 text-success"><ShieldCheck className="size-5" /></div>
                      <span>Public verification stays off-chain</span>
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-foreground/65">Verification calls compare MongoDB and contract state without auto-submitting blockchain transactions or spending gas.</div>
                  </div>
                  <div className="rounded-xl border border-border/10 bg-foreground/[0.02] p-5 hover:border-accent/20 transition-colors">
                    <div className="flex items-center gap-3 font-semibold text-foreground">
                      <div className="p-2 rounded-xl bg-accent/10 text-accent"><GraduationCap className="size-5" /></div>
                      <span>Bulk issuance remains resilient</span>
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-foreground/65">CSV imports now continue past bad rows and return a clear split between succeeded and failed records.</div>
                  </div>
                  <div className="rounded-xl border border-border/10 bg-foreground/[0.02] p-5 hover:border-accent/20 transition-colors">
                    <div className="flex items-center gap-3 font-semibold text-foreground">
                      <div className="p-2 rounded-xl bg-warning/10 text-warning"><Building2 className="size-5" /></div>
                      <span>Access is tenant-aware</span>
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-foreground/65">Certificate ownership checks are consistently enforced before view, update, or revoke actions are allowed.</div>
                  </div>
                </div>
              </DashboardSection>
            </>
          )}
        </div>
      </div>

      {!loading && !error && data ? (
        <div className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
          <DashboardSection 
            title="Recent certificates" 
            description="The latest certificates issued or managed by your institution."
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleExport('csv')}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border/12 bg-foreground/[0.04] px-4 text-xs font-semibold text-foreground/80 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
                  aria-label="Export certificates to CSV"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => void handleExport('pdf')}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border/12 bg-foreground/[0.04] px-4 text-xs font-semibold text-foreground/80 hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
                  aria-label="Export certificates to PDF"
                >
                  Export PDF
                </button>
                {selectedForRevoke.size > 0 && (
                  <button
                    type="button"
                    disabled={revokingBulk}
                    onClick={() => void revokeBulk()}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 px-4 text-xs font-semibold text-destructive hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive transition-colors"
                  >
                    {revokingBulk ? 'Revoking...' : `Revoke Selected (${selectedForRevoke.size})`}
                  </button>
                )}
              </div>
            }
          >
            {data.certificates.items.length === 0 ? (
              <EmptyListState
                title="No institution certificates yet"
                description="Use the issuance form to create your first blockchain-backed certificate for a student."
              />
            ) : (
              <div className="grid gap-3 text-sm text-foreground/70">
                {data.certificates.items.map((item) => (
                  <div
                    key={item.certificateId}
                    className="group rounded-2xl border border-border/12 bg-foreground/[0.03] p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
                    onClick={() => setSelectedCert(item)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        {item.status !== 'revoked' && (
                          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedForRevoke.has(item.certificateId)}
                              onChange={(e) => {
                                const newSet = new Set(selectedForRevoke);
                                if (e.target.checked) newSet.add(item.certificateId);
                                else newSet.delete(item.certificateId);
                                setSelectedForRevoke(newSet);
                              }}
                              className="size-4 rounded border-border/20 bg-foreground/[0.05] accent-destructive focus:ring-destructive/50"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <span>{item.studentName}</span>
                            <ChevronRight className="size-4 text-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-foreground/60">
                            <span className="font-mono text-xs">{item.certificateId}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); void copyCertId(item.certificateId); }}
                              className="text-foreground/40 hover:text-accent transition"
                              aria-label="Copy Certificate ID"
                            >
                              {copiedId === item.certificateId ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                            </button>
                          </div>
                          <div className="text-foreground/55 mt-0.5">{item.degree}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={item.status} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl text-xs gap-1.5 border-border/20 hover:border-accent/40 hover:bg-accent/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setSelectedCert(item); }}
                        >
                          <ShieldCheck className="size-3.5 text-accent" />
                          <span>Verify</span>
                        </Button>
                        {item.status !== 'revoked' && (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={revoking === item.certificateId}
                            onClick={(e) => { e.stopPropagation(); void revokeCertificate(item.certificateId); }}
                          >
                            <ShieldOff className="size-3.5" />
                            {revoking === item.certificateId ? 'Revoking...' : 'Revoke'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-3 pt-3 border-t border-border/10">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-foreground/50">Course</div>
                        <div className="mt-1 text-foreground/80 truncate">{item.course}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-foreground/50">Issued</div>
                        <div className="mt-1 text-foreground/80">{formatDate(item.issueDate)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-foreground/50">Verifications</div>
                        <div className="mt-1 text-foreground/80">{formatNumber(item.verificationCount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <div className="grid gap-6">
            <DashboardSection title="Institution notifications" description="Recent messages related to issuance, students, and platform operations.">
              {data.notifications.length === 0 ? (
                <EmptyListState
                  title="No notifications yet"
                  description="Institution alerts, issuance confirmations, and operational notices will appear here when available."
                />
              ) : (
                <div className="grid gap-3 text-sm text-foreground/70">
                  {data.notifications.slice(0, 5).map((item) => (
                    <div key={item._id} className="rounded-2xl border border-border/12 bg-foreground/[0.03] p-4">
                      <div className="font-semibold text-foreground">{item.title}</div>
                      <div className="mt-1 leading-6 text-foreground/65">{item.message}</div>
                      {item.createdAt ? <div className="mt-3 text-xs text-foreground/50">{formatDate(item.createdAt)}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>

            <DashboardSection title="Recent certificate activity" description="A compact snapshot of the freshest issuance outcomes for this institution.">
              {data.analytics.recentCertificates.length === 0 ? (
                <EmptyListState
                  title="No recent activity"
                  description="Freshly issued or updated certificates will appear here once this institution starts transacting."
                />
              ) : (
                <div className="grid gap-3 text-sm text-foreground/70">
                  {data.analytics.recentCertificates.slice(0, 4).map((item) => (
                    <div key={item.certificateId} className="rounded-2xl border border-border/12 bg-foreground/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-foreground">{item.studentName}</div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="mt-1 text-foreground/65">{item.degree} · {item.course}</div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-foreground/55">
                        <Activity className="size-3.5" />
                        {item.transactionHash ? 'Blockchain transaction recorded' : 'Waiting for transaction details'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>
          </div>
        </div>
        ) : null}
      {selectedCert && (
        <CertificateDetailModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </DashboardShell>
  );
}
