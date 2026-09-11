"use client";

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard-shell';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  User, 
  FileText, 
  Calendar,
  Layers,
  X,
  ExternalLink,
  Download
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Certificate } from '@/types';

type ApiResponse<T> = { success: boolean; message: string; data: T };
type PaginatedData = { items: Certificate[]; total: number; page: number; limit: number };

export default function InstitutionApprovalsPage() {
  const { data: session } = useSession();
  const [drafts, setDrafts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Certificate | null>(null);

  const fetchDrafts = useCallback(async () => {
    if (!session?.user.accessToken) return;
    setLoading(true);
    try {
      const response = await apiFetch<ApiResponse<PaginatedData>>(
        '/certificates?status=pending_approval&limit=50',
        { token: session.user.accessToken }
      );
      setDrafts(response.data.items);
    } catch (err) {
      toast.error('Failed to load pending certificate drafts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session?.user.accessToken]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleApprove = async (certificateId: string) => {
    if (!session?.user.accessToken) return;
    setSubmittingId(certificateId);
    try {
      await apiFetch<ApiResponse<Record<string, unknown>>>(
        `/certificates/${certificateId}/approve`,
        {
          method: 'POST',
          token: session.user.accessToken,
        }
      );
      toast.success('Certificate approved and anchored on-chain successfully');
      setDrafts((prev) => prev.filter((d) => d.certificateId !== certificateId));
      if (previewItem?.certificateId === certificateId) {
        setPreviewItem(null);
      }
    } catch (err) {
      toast.error('Failed to approve certificate draft');
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <DashboardShell title="Credential Approvals Queue">
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="rounded-[30px] border border-border/12 bg-foreground/[0.03] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-2xl">
            <Badge className="mb-4 border-accent/30 bg-accent/10 text-accent font-semibold tracking-wider">
              MULTI-SIGNATURE GOVERNANCE
            </Badge>
            <h2 className="text-2xl font-bold text-foreground">Dual-Authorizer Queue</h2>
            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
              Verify drafted credentials prepared by institutional registrars. Approving a draft triggers cryptographically signed anchoring transactions on the Ethereum blockchain.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-foreground/50">Loading pending drafts...</div>
        ) : drafts.length === 0 ? (
          <GlassCard className="p-8 text-center text-foreground/50">
            <Clock className="size-10 mx-auto text-foreground/30 mb-3" />
            <div className="text-lg font-semibold text-foreground">No drafts pending approval</div>
            <div className="text-sm mt-1">All prepared certificates have been signed and anchored.</div>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {drafts.map((item) => (
              <GlassCard key={item.certificateId} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 border-border/12 bg-card">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="font-mono text-[10px] text-foreground/50 border-border/12 bg-foreground/[0.04]">
                      {item.certificateId}
                    </Badge>
                    <Badge className="border-warning/30 bg-warning/10 text-warning font-semibold flex items-center gap-1">
                      <Clock className="size-3" />
                      Pending Approval
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold text-foreground truncate">{item.studentName}</h4>
                    <p className="text-sm text-foreground/70 font-semibold mt-0.5">{item.degree}</p>
                    <p className="text-xs text-foreground/50 mt-1">{item.course} · {item.institutionName}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-border/10">
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <Layers className="size-3.5 text-foreground/40" />
                      <span>Dept: {item.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      <Calendar className="size-3.5 text-foreground/40" />
                      <span>Issued: {formatDate(item.issueDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/60 col-span-2 md:col-span-1">
                      <User className="size-3.5 text-foreground/40" />
                      <span>Student ID: {item.studentId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPreviewItem(item)}
                    className="flex items-center gap-1.5 rounded-2xl h-10 px-4 text-xs font-semibold"
                  >
                    <FileText className="size-4" />
                    Preview PDF
                  </Button>
                  <Button
                    onClick={() => handleApprove(item.certificateId)}
                    disabled={submittingId === item.certificateId}
                    className="flex items-center gap-2 rounded-2xl h-10 px-4 font-semibold"
                  >
                    <CheckCircle className="size-4" />
                    {submittingId === item.certificateId ? 'Anchoring...' : 'Approve & Issue'}
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* PDF Preview Modal Overlay */}
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <GlassCard className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-border/20 shadow-2xl rounded-3xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/12 bg-card/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-accent/10 text-accent">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate">
                      PDF Preview — {previewItem.studentName}
                    </h3>
                    <p className="text-xs text-foreground/50 font-mono">
                      ID: {previewItem.certificateId} · {previewItem.degree}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {previewItem.ipfsUrl && (
                    <>
                      <a
                        href={previewItem.ipfsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/15 bg-foreground/[0.04] px-3 text-xs font-semibold text-foreground/80 hover:bg-foreground/[0.08]"
                      >
                        <ExternalLink className="size-3.5" />
                        Open Tab
                      </a>
                      <a
                        href={previewItem.ipfsUrl}
                        download={`${previewItem.certificateId}.pdf`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/15 bg-foreground/[0.04] px-3 text-xs font-semibold text-foreground/80 hover:bg-foreground/[0.08]"
                      >
                        <Download className="size-3.5" />
                        Download
                      </a>
                    </>
                  )}
                  <Button
                    onClick={() => handleApprove(previewItem.certificateId)}
                    disabled={submittingId === previewItem.certificateId}
                    className="flex items-center gap-1.5 rounded-xl h-9 px-3 text-xs font-semibold"
                  >
                    <CheckCircle className="size-3.5" />
                    Approve Now
                  </Button>
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="p-2 rounded-xl text-foreground/50 hover:text-foreground hover:bg-foreground/[0.08] transition-colors ml-1"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Embedded PDF Viewer */}
              <div className="flex-1 p-4 bg-black/40 overflow-hidden flex items-center justify-center min-h-[500px]">
                {previewItem.ipfsUrl ? (
                  <iframe
                    src={previewItem.ipfsUrl}
                    className="w-full h-full min-h-[500px] rounded-2xl border border-border/10 bg-white"
                    title={`PDF Preview for ${previewItem.studentName}`}
                  />
                ) : (
                  <div className="text-center p-8 text-foreground/50">
                    <FileText className="size-12 mx-auto mb-2 text-foreground/30" />
                    <p className="text-sm">PDF preview link unavailable for this draft.</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
