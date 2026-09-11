"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, BellRing, Building2, FileCheck2, ShieldCheck } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import {
  DashboardMetricCard,
  DashboardSection,
  DashboardStateCard,
  EmptyListState,
  RetryButton,
  StatusBadge,
} from '@/components/dashboard/dashboard-primitives';
import { AnalyticsChart } from '@/components/dashboard/analytics-chart';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import type { Certificate } from '@/types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

type OverviewAnalytics = {
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
    stats: {
      certificatesIssued: number;
      certificatesRevoked: number;
      studentsManaged: number;
    };
  }>;
};

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt?: string;
};

type CertificateListResponse = {
  items: Certificate[];
  total: number;
  page: number;
  limit: number;
};

type DashboardData = {
  analytics: OverviewAnalytics;
  notifications: NotificationItem[];
  certificates: CertificateListResponse;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!session?.user.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [analyticsResponse, notificationsResponse, certificatesResponse] = await Promise.all([
        apiFetch<ApiResponse<OverviewAnalytics>>('/analytics/overview', { token: session.user.accessToken }),
        apiFetch<ApiResponse<NotificationItem[]>>('/notifications', { token: session.user.accessToken }),
        apiFetch<ApiResponse<CertificateListResponse>>('/certificates?limit=5', { token: session.user.accessToken }),
      ]);

      setData({
        analytics: analyticsResponse.data,
        notifications: notificationsResponse.data,
        certificates: certificatesResponse.data,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [session?.user.accessToken]);

  useEffect(() => {
    if (status === 'authenticated') {
      void loadDashboard();
      return;
    }

    if (status === 'unauthenticated') {
      setLoading(false);
      setError('You need to sign in to load the dashboard.');
    }
  }, [loadDashboard, status]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!session?.user.accessToken) return;
    try {
      await apiFetch(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        token: session.user.accessToken
      });
      toast.success('Notification marked as read');
      void loadDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    if (!session?.user.accessToken || !data?.notifications) return;
    const unread = data.notifications.filter(n => !n.read);
    if (unread.length === 0) {
      toast.info('All notifications are already read');
      return;
    }
    try {
      await Promise.all(
        unread.map(n =>
          apiFetch(`/notifications/${n._id}/read`, {
            method: 'PATCH',
            token: session.user.accessToken
          })
        )
      );
      toast.success('All notifications marked as read');
      void loadDashboard();
    } catch {
      toast.error('Failed to mark all notifications as read');
    }
  };

  if (status === 'unauthenticated') {
    return (
      <DashboardShell title="Platform Overview">
        <DashboardStateCard
          title="Sign in required"
          description="Please sign in to access your platform dashboard, issue certificates, and manage credentials."
          action={
            <Link href="/login">
              <Button className="rounded-full px-6 font-semibold shadow-glow">
                Sign In to Platform
              </Button>
            </Link>
          }
        />
      </DashboardShell>
    );
  }

  if (loading) {
    return (
      <DashboardShell title="Platform Overview">
        <DashboardStateCard
          variant="loading"
          title="Loading platform overview"
          description="Pulling analytics, recent certificates, and notification activity for your session."
        />
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell title="Platform Overview">
        <DashboardStateCard
          variant="error"
          title="Unable to load dashboard data"
          description={error}
          action={
            <div className="flex items-center gap-3">
              <RetryButton onClick={() => void loadDashboard()} />
              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Sign In Again
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
      <DashboardShell title="Platform Overview">
        <DashboardStateCard
          title="No overview data yet"
          description="Once certificates, institutions, and notifications are active, this page will summarize the entire platform."
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Platform Overview">
      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr] items-stretch">
        <div className="flex flex-col justify-center">
          <GlassCard className="relative overflow-hidden mb-8 p-8 border-border/10 shadow-glass-lg group">
            {/* Ambient Lighting Effect */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent/30 transition-all duration-700 ease-in-out group-hover:scale-110" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700 ease-in-out" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Unified operations snapshot
              </div>
              <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl drop-shadow-sm">
                Track issuance and <br/> trust signals.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/70 font-medium">
                The network has anchored <strong className="text-foreground">{formatNumber(data.analytics.stats.certificatesIssued)} credentials</strong> across <strong className="text-foreground">{formatNumber(data.analytics.stats.institutions)} institutions</strong>, establishing a verifiable public record.
              </p>
            </div>
          </GlassCard>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="group relative overflow-hidden rounded-[24px] border border-border/10 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow hover:border-accent/30 cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">Students Tracked</div>
                <div className="mt-2 text-3xl font-bold tracking-tighter text-foreground">{formatNumber(data.analytics.stats.students)}</div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[24px] border border-border/10 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow hover:border-accent/30 cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">On-chain Writes</div>
                <div className="mt-2 text-3xl font-bold tracking-tighter text-foreground">{formatNumber(data.analytics.stats.transactions)}</div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[24px] border border-border/10 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow hover:border-accent/30 cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">Revocations</div>
                <div className="mt-2 text-3xl font-bold tracking-tighter text-foreground">{formatNumber(data.analytics.stats.certificatesRevoked)}</div>
              </div>
            </div>
          </div>
        </div>
        <DashboardSection
          title="Trust posture"
          description="Quick platform health indicators for registrars and admins."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/documentation">
                View docs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        >
          <div className="grid gap-3 text-sm text-foreground/70">
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-4 text-success" /> Verification is read-only</div>
              <div className="mt-2 text-foreground/65">Public verification compares MongoDB and on-chain state without broadcasting transactions or consuming gas.</div>
            </div>
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground"><Building2 className="size-4 text-accent" /> Institution coverage</div>
              <div className="mt-2 text-foreground/65">Top-ranked issuers and activity summaries help identify rollout momentum across the network.</div>
            </div>
            <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 font-semibold text-foreground"><BellRing className="size-4 text-warning" /> Notification center</div>
              <div className="mt-2 text-foreground/65">Unread operational events remain visible so staff can react quickly to issuance and student activity.</div>
            </div>
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Certificates issued"
          value={data.analytics.stats.certificatesIssued}
          caption="Total records created across the platform."
          badge="live"
        />
        <DashboardMetricCard
          label="Verified certificates"
          value={data.analytics.stats.certificatesVerified}
          caption="Certificates that completed at least one successful verification."
          badge="read-only"
        />
        <DashboardMetricCard
          label="Revoked certificates"
          value={data.analytics.stats.certificatesRevoked}
          caption="Certificates explicitly invalidated by authorized actors."
        />
        <DashboardMetricCard
          label="Active institutions"
          value={data.analytics.stats.institutions}
          caption="Issuing organizations represented in the registry."
        />
      </div>

      <div className="mt-6 mb-6">
        <AnalyticsChart />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,0.9fr] items-stretch">
        <DashboardSection
          title="Recent certificates"
          description="Newest certificate records available to your role."
          action={<Button variant="secondary" size="sm">Latest 5</Button>}
        >
          {data.certificates.items.length === 0 ? (
            <EmptyListState
              title="No certificates issued yet"
              description="Once institutions start issuing, the latest certificate IDs and lifecycle states will surface here."
            />
          ) : (
            <div className="grid gap-4 text-sm text-foreground/70">
              {data.certificates.items.map((item) => (
                <div key={item.certificateId} className="group rounded-[2rem] border border-border/12 bg-foreground/[0.03] p-5 transition-all duration-300 hover:border-accent/30 hover:bg-accent/5 hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-semibold text-foreground">{item.studentName}</div>
                      <div className="mt-1 text-foreground/60">{item.certificateId} · {item.degree}</div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 grid gap-2 text-xs uppercase tracking-wide text-foreground/55 grid-cols-1 md:grid-cols-3">
                    <div className="min-w-0">
                      <div>Institution</div>
                      <div className="mt-1 text-sm normal-case tracking-normal text-foreground/75 truncate">{item.institutionName}</div>
                    </div>
                    <div className="min-w-0">
                      <div>Course</div>
                      <div className="mt-1 text-sm normal-case tracking-normal text-foreground/75 truncate">{item.course}</div>
                    </div>
                    <div className="min-w-0">
                      <div>Issued</div>
                      <div className="mt-1 text-sm normal-case tracking-normal text-foreground/75">{formatDate(item.issueDate)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title="Notifications"
          description="The newest certificate and workflow updates for your account."
          action={<Button variant="secondary" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
        >
          {data.notifications.length === 0 ? (
            <EmptyListState
              title="No notifications"
              description="System notices, issuance updates, and student-facing events will appear here when available."
            />
          ) : (
            <div className="grid gap-4 text-sm text-foreground/70">
              {data.notifications.slice(0, 5).map((item) => (
                <div 
                  key={item._id} 
                  onClick={() => !item.read && void handleMarkAsRead(item._id)}
                  className={cn(
                    "group rounded-3xl border border-border/12 bg-foreground/[0.03] p-4 transition-all duration-300 hover:border-accent/30 hover:bg-accent/5 hover:-translate-y-0.5 hover:shadow-lg",
                    !item.read && "cursor-pointer active:scale-[0.99]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">{item.title}</div>
                      <div className="mt-1 leading-6 text-foreground/65">{item.message}</div>
                    </div>
                    <StatusBadge status={item.read ? 'read' : 'unread'} />
                  </div>
                  {item.createdAt ? <div className="mt-3 text-xs text-foreground/55">{formatDate(item.createdAt)}</div> : null}
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      <DashboardSection
        title="Top institutions"
        description="Ranking by issuance volume with revocation and student totals for context."
        action={<Button variant="secondary" size="sm">Leaderboard</Button>}
      >
        {data.analytics.institutionRankings.length === 0 ? (
          <EmptyListState
            title="No institution analytics yet"
            description="Institution rankings will appear as soon as certificate activity is recorded in the platform."
          />
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border/12 scrollbar-thin">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-foreground/[0.05] text-foreground/55">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Institution</th>
                  <th className="px-4 py-3 whitespace-nowrap">Issued</th>
                  <th className="px-4 py-3 whitespace-nowrap">Revoked</th>
                  <th className="px-4 py-3 whitespace-nowrap">Students</th>
                </tr>
              </thead>
              <tbody>
                {data.analytics.institutionRankings.slice(0, 5).map((institution) => (
                  <tr key={institution._id} className="border-t border-border/10 bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-colors duration-150 cursor-default">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{institution.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatNumber(institution.stats.certificatesIssued)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatNumber(institution.stats.certificatesRevoked)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatNumber(institution.stats.studentsManaged)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Operational highlights" description="A compact readout for the current platform state.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4 text-sm text-foreground/70">
            <div className="flex items-center gap-2 font-semibold text-foreground"><FileCheck2 className="size-4 text-accent" /> Verification throughput</div>
            <div className="mt-2 leading-6 text-foreground/65">{formatNumber(data.analytics.stats.certificatesVerified)} certificates have already been validated through the public read-only verification flow.</div>
          </div>
          <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4 text-sm text-foreground/70">
            <div className="flex items-center gap-2 font-semibold text-foreground"><Building2 className="size-4 text-accent" /> Institution footprint</div>
            <div className="mt-2 leading-6 text-foreground/65">The platform currently spans {formatNumber(data.analytics.stats.institutions)} institutions and {formatNumber(data.analytics.stats.students)} tracked students.</div>
          </div>
          <div className="rounded-3xl border border-border/12 bg-foreground/[0.04] p-4 text-sm text-foreground/70">
            <div className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-4 text-success" /> Audit readiness</div>
            <div className="mt-2 leading-6 text-foreground/65">Issuance, update, and revocation writes remain traceable while verification stays off-chain and gas-free for the public.</div>
          </div>
        </div>
      </DashboardSection>
    </DashboardShell>
  );
}
