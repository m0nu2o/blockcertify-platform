"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Award, BadgeCheck, Ban, Building2, Calendar, Copy, Download, ExternalLink, GraduationCap,
  Hash, Layers, Link2, Loader2, QrCode, Share2, Sparkles, ShieldCheck, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { 
  OfficialDiplomaCanvas, 
  BlockchainAuditReceipt,
  getStoredTemplate, 
  populateTemplateWithCert, 
  downloadDiplomaPdf, 
  downloadBlockchainAuditPdf,
  exportBlockchainProofJson,
  TemplateConfig 
} from '@/components/dashboard/diploma-canvas';

type CertificateData = {
  certificateId: string;
  studentName: string;
  studentId: string;
  institutionName: string;
  degree: string;
  course: string;
  department: string;
  issueDate: string;
  expiryDate?: string;
  status: 'issued' | 'verified' | 'revoked' | 'expired';
  transactionHash?: string;
  ipfsUrl?: string;
  qrCodeDataUrl?: string;
  verificationCount: number;
};

const statusConfig = {
  verified: { label: 'Verified', color: 'border-success/30 bg-success/10 text-success', icon: BadgeCheck },
  issued: { label: 'Issued', color: 'border-accent/30 bg-accent/10 text-accent', icon: Award },
  revoked: { label: 'Revoked', color: 'border-danger/30 bg-danger/10 text-danger', icon: Ban },
  expired: { label: 'Expired', color: 'border-warning/30 bg-warning/10 text-warning', icon: Layers },
};

export default function CertificatePublicPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const diplomaRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ certificateId: id }),
        });
        const data = await res.json();
        if (!res.ok || !data.data?.certificate) throw new Error(data.message || 'Certificate not found');
        const certificateData = data.data.certificate as CertificateData;
        setCert(certificateData);
        const stored = getStoredTemplate();
        setTemplateConfig(populateTemplateWithCert(stored, certificateData as any));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Certificate not found');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const copyId = async () => {
    await navigator.clipboard.writeText(id);
    toast.success('Certificate ID copied!');
  };

  const downloadPdf = async () => {
    if (!diplomaRef.current || !cert) return;
    setDownloading(true);
    try {
      await downloadDiplomaPdf(
        diplomaRef.current,
        `BlockCertify_${cert.studentName.replace(/\s+/g, '_')}_${cert.certificateId}.pdf`
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const linkedInUrl = cert
    ? `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(cert.degree)}&organizationName=${encodeURIComponent(cert.institutionName)}&issueYear=${new Date(cert.issueDate).getFullYear()}&issueMonth=${new Date(cert.issueDate).getMonth() + 1}&certId=${encodeURIComponent(cert.certificateId)}&certUrl=${encodeURIComponent(shareUrl)}`
    : '#';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-foreground/60">
          <Loader2 className="size-10 animate-spin text-accent" />
          <p className="text-sm font-medium">Loading official certificate credential...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-md w-full text-center p-10">
          <Ban className="size-12 text-danger mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-foreground/60">{error || 'This certificate ID does not exist on the blockchain registry.'}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/verify"><Button variant="secondary">Try Manual Search</Button></Link>
            <Link href="/"><Button>Go Home</Button></Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const statusInfo = statusConfig[cert.status] ?? statusConfig.issued;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen px-3 sm:px-6 py-10 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-border/12 bg-card/80 p-4 sm:p-6 shadow-glass backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <Link href="/" className="text-xl font-bold text-foreground hover:text-accent transition flex items-center gap-2">
            <ShieldCheck className="size-5 text-accent" /> BlockCertify
          </Link>
          <p className="text-xs text-foreground/50 mt-0.5">Cryptographically Verified University Credential</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/verify?id=${cert.certificateId}`}>
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <BadgeCheck className="size-4 text-accent" /> Verify On-Chain
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => void downloadPdf()}
            disabled={downloading}
            className="gap-1.5 bg-accent text-accent-foreground font-bold text-xs"
          >
            <Download className="size-4" />
            {downloading ? 'Exporting...' : 'Download Official PDF'}
          </Button>
        </div>
      </motion.div>

      {/* Main Official Diploma Presentation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {templateConfig && (
          <div className="rounded-3xl p-3 sm:p-6 bg-[#050811] border border-border/20 shadow-2xl flex flex-col items-center justify-center space-y-3">
            <div className="w-full flex items-center justify-between text-xs text-foreground/60 px-1">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sparkles className="size-3.5 text-accent" /> Official Degree Diploma (Master Template Layout)
              </span>
              <span className="text-[10px] border border-accent/40 bg-accent/10 px-2 py-0.5 rounded-full text-accent font-mono font-semibold">
                A4 Landscape 300+ DPI
              </span>
            </div>

            <div className="w-full max-w-4xl">
              <OfficialDiplomaCanvas 
                ref={diplomaRef}
                config={templateConfig} 
              />
            </div>
          </div>
        )}

        {/* Verification & Metadata Section */}
        <GlassCard className="relative overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`grid size-12 place-items-center rounded-2xl border ${statusInfo.color}`}>
                <StatusIcon className="size-6" />
              </div>
              <div>
                <Badge className={`${statusInfo.color} capitalize font-semibold`}>{statusInfo.label}</Badge>
                <p className="text-xs text-foreground/50 mt-1">Official Blockchain Credential</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/20 bg-foreground/[0.04] px-4 py-2.5">
              <Hash className="size-3.5 text-accent" />
              <span className="text-xs font-mono font-semibold text-foreground/90">{cert.certificateId}</span>
              <button onClick={copyId} className="ml-1 text-foreground/40 hover:text-accent transition p-0.5" aria-label="Copy Certificate ID">
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <Building2 className="size-4" /> <span>Issuing Institution</span>
              </div>
              <p className="font-bold text-foreground leading-normal break-words">{cert.institutionName}</p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <Calendar className="size-4" /> <span>Date of Issue</span>
              </div>
              <p className="font-bold text-foreground leading-normal">{formatDate(cert.issueDate)}</p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <GraduationCap className="size-4" /> <span>Awarded Degree</span>
              </div>
              <p className="font-bold text-foreground leading-normal">{cert.degree}</p>
            </div>
            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <ShieldCheck className="size-4" /> <span>Audit Verifications</span>
              </div>
              <p className="font-bold text-foreground leading-normal">{cert.verificationCount} times verified</p>
            </div>
          </div>

          {/* Blockchain Hash */}
          {cert.transactionHash && (
            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                <Link2 className="size-4" />
                <span>Ethereum Blockchain Transaction</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-mono text-foreground/80 break-all leading-relaxed">{cert.transactionHash}</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL || 'https://etherscan.io/tx'}/${cert.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-accent hover:text-accent/70 transition p-1"
                  aria-label="View on Explorer"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          )}

          {/* QR Code */}
          {cert.qrCodeDataUrl && (
            <div className="flex flex-col items-center gap-2.5 py-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                <QrCode className="size-4" /> Official QR Verification Code
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cert.qrCodeDataUrl}
                alt="QR verification code"
                className="size-36 rounded-2xl border border-border/20 bg-white p-2.5 shadow-md"
              />
            </div>
          )}

          {/* Official Blockchain Audit Receipt */}
          <div className="pt-2 border-t border-border/10">
            <div className="flex items-center justify-between text-xs text-foreground/60 px-1 mb-2">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="size-3.5 text-blue-400" /> On-Chain Cryptographic Audit Receipt
              </span>
              <span className="text-[10.5px] font-mono text-emerald-400 font-semibold">
                Ethereum Consensus Verified
              </span>
            </div>
            <div className="flex justify-center">
              <BlockchainAuditReceipt 
                ref={auditRef}
                cert={cert} 
              />
            </div>
          </div>

          {/* Cryptographic Audit & Proof Export Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1 border-t border-border/10">
            <Button
              variant="secondary"
              className="flex-1 gap-2 border border-border/20 hover:bg-accent/10 hover:text-accent font-semibold"
              onClick={() => downloadBlockchainAuditPdf(auditRef.current, cert)}
            >
              <FileText className="size-4 text-accent" /> Download Blockchain Audit Receipt (PDF)
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2 border border-border/20 hover:bg-accent/10 hover:text-accent font-semibold"
              onClick={() => exportBlockchainProofJson(cert)}
            >
              <Download className="size-4 text-accent" /> Export Proof (JSON)
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1 gap-2 bg-accent text-accent-foreground font-bold"
              onClick={() => void downloadPdf()}
              disabled={downloading}
            >
              <Download className="size-4" />
              {downloading ? 'Exporting Master Diploma...' : 'Download Official Diploma PDF'}
            </Button>
            {cert.status !== 'revoked' && (
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full gap-2 border-accent/25 hover:bg-accent/10 hover:text-accent">
                  <Share2 className="size-4" /> Add to LinkedIn
                </Button>
              </a>
            )}
            <Link href={`/verify?id=${cert.certificateId}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2 border-border/20">
                <BadgeCheck className="size-4 text-accent" /> Verify Authenticity
              </Button>
            </Link>
          </div>
        </GlassCard>

        {/* Footer note */}
        <p className="text-center text-xs text-foreground/40 pt-2">
          This credential is cryptographically anchored to Ethereum blockchain by BlockCertify. <br />
          Credential ID: <span className="font-mono text-accent">{cert.certificateId}</span>
        </p>
      </motion.div>
    </div>
  );
}
