"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Award, Check, ChevronRight, Copy, QrCode, Share2, ShieldCheck } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
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
import { toast } from 'sonner';

type ApiResponse<T> = { success: boolean; message: string; data: T };

type StudentAnalytics = {
  totalCertificates: number;
  verifiedCertificates: number;
  certificates: Certificate[];
};

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  link?: string;
  createdAt?: string;
};

type StudentDashboardData = {
  analytics: StudentAnalytics;
  notifications: NotificationItem[];
};

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!session?.user.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [analyticsResponse, notificationsResponse] = await Promise.all([
        apiFetch<ApiResponse<StudentAnalytics>>('/analytics/student', { token: session.user.accessToken }),
        apiFetch<ApiResponse<NotificationItem[]>>('/notifications', { token: session.user.accessToken }),
      ]);

      setData({ analytics: analyticsResponse.data, notifications: notificationsResponse.data });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load student dashboard');
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
      setError('You need to sign in to load the student dashboard.');
    }
  }, [loadDashboard, status]);

  const copyCertId = async (certId: string) => {
    await navigator.clipboard.writeText(certId);
    setCopiedId(certId);
    toast.success('Certificate ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <DashboardShell title="Student Dashboard">
        <DashboardStateCard
          variant="loading"
          title="Loading student dashboard"
          description="Preparing your certificates, verification status, and the latest notifications."
        />
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell title="Student Dashboard">
        <DashboardStateCard
          variant="error"
          title="Unable to load student workspace"
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
      <DashboardShell title="Student Dashboard">
        <DashboardStateCard
          title="No student data yet"
          description="When certificates are issued to this account, you'll see verification details, ownership proof, and notifications here."
        />
      </DashboardShell>
    );
  }

  return (
    <>
      <DashboardShell title="Student Dashboard">
        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-2xl border border-border/12 bg-gradient-to-br from-accent/12 via-foreground/[0.04] to-transparent p-6 sm:p-8 shadow-glass backdrop-blur-2xl flex flex-col justify-between">
            <div>
              <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Credential Portfolio
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Review, share, and verify your credentials with a clean student-first experience.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
                Manage your academic records, track on-chain status, and share tamper-proof verification links with potential employers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/10 flex items-center gap-4 text-xs font-semibold text-foreground/60">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-foreground/[0.04] px-3.5 py-1.5">
                <ShieldCheck className="size-4 text-success" /> Immutable Proofs
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/15 bg-foreground/[0.04] px-3.5 py-1.5">
                <Share2 className="size-4 text-accent" /> One-Click Share
              </span>
            </div>
          </div>
          <DashboardSection title="Student essentials" description="Quick guidance for sharing and validating your credentials.">
            <div className="grid gap-3 text-sm text-foreground/70">
              <div className="rounded-xl border border-border/10 bg-foreground/[0.02] p-5 hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-3 font-semibold text-foreground">
                  <div className="p-2 rounded-xl bg-success/10 text-success"><ShieldCheck className="size-5" /></div>
                  <span>Verification is public and read-only</span>
                </div>
                <div className="mt-2 text-xs leading-relaxed text-foreground/65">Anyone can validate your certificate without spending gas or triggering on-chain writes during the lookup.</div>
              </div>
              <div className="rounded-xl border border-border/10 bg-foreground/[0.02] p-5 hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-3 font-semibold text-foreground">
                  <div className="p-2 rounded-xl bg-accent/10 text-accent"><Share2 className="size-5" /></div>
                  <span>Shareable proof</span>
                </div>
                <div className="mt-2 text-xs leading-relaxed text-foreground/65">Each certificate can be distributed via certificate ID, transaction hash, or QR verification link, depending on the record.</div>
              </div>
              <div className="rounded-xl border border-border/10 bg-foreground/[0.02] p-5 hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-3 font-semibold text-foreground">
                  <div className="p-2 rounded-xl bg-warning/10 text-warning"><QrCode className="size-5" /></div>
                  <span>QR-ready credentials</span>
                </div>
                <div className="mt-2 text-xs leading-relaxed text-foreground/65">As institutions issue new records, QR verification and supporting metadata become available in the certificate payload.</div>
              </div>
            </div>
          </DashboardSection>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardMetricCard
            label="My certificates"
            value={data.analytics.totalCertificates}
            caption="All credentials issued to this student account."
            badge="student"
          />
          <DashboardMetricCard
            label="Verified certificates"
            value={data.analytics.verifiedCertificates}
            caption="Credentials already confirmed through a successful verification flow."
          />
          <DashboardMetricCard
            label="Notifications"
            value={data.notifications.length}
            caption="Recent student-facing updates and alerts."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <DashboardSection title="My certificates" description="A clear view of all academic or professional credentials available to you.">
            {data.analytics.certificates.length === 0 ? (
              <EmptyListState
                title="No certificates issued yet"
                description="Your institution has not issued any certificates to this student account yet. Once available, they will appear here with verification details."
              />
            ) : (
              <div className="grid gap-4">
                {data.analytics.certificates.map((item) => (
                  <div
                    key={item.certificateId}
                    className="group rounded-2xl border border-border/12 bg-foreground/[0.03] p-5 text-sm text-foreground/70 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
                    onClick={() => setSelectedCert(item)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-foreground/50 flex items-center gap-2">
                          <span className="font-mono">{item.certificateId}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); void copyCertId(item.certificateId); }}
                            className="text-foreground/40 hover:text-accent transition"
                            aria-label="Copy Certificate ID"
                          >
                            {copiedId === item.certificateId ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                          </button>
                        </div>
                        <div className="mt-2 text-lg font-semibold text-foreground flex items-center gap-2">
                          <span>{item.degree}</span>
                          <ChevronRight className="size-4 text-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div className="mt-1 text-foreground/65">{item.course} · {item.institutionName}</div>
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
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-foreground/50">Department</div>
                        <div className="mt-1 text-foreground/80">{item.department}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-foreground/50">Issued</div>
                        <div className="mt-1 text-foreground/80">{formatDate(item.issueDate)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-foreground/50">Verifications</div>
                        <div className="mt-1 text-foreground/80">{formatNumber(item.verificationCount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection title="Notifications" description="Messages related to issuance, verification, and student access.">
            {data.notifications.length === 0 ? (
              <EmptyListState
                title="No notifications yet"
                description="Certificate updates, reminders, and important student alerts will appear here when the platform generates them."
              />
            ) : (
              <div className="grid gap-3 text-sm text-foreground/70">
                {data.notifications.slice(0, 5).map((item) => (
                  <div key={item._id} className="rounded-3xl border border-border/12 bg-foreground/[0.03] p-4">
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="mt-1 leading-6 text-foreground/65">{item.message}</div>
                    {item.createdAt ? <div className="mt-3 text-xs text-foreground/50">{formatDate(item.createdAt)}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </DashboardShell>
      {selectedCert && (
        <CertificateDetailModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </>
  );
}
