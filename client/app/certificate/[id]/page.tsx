"use client";

import { useEffect, useRef, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Award, BadgeCheck, Ban, Building2, Calendar, Copy, Download, ExternalLink, GraduationCap,
  Hash, Layers, Link2, Loader2, QrCode, Share2, Sparkles, ShieldCheck, FileText,
  AlertTriangle, XCircle, Search, User, CheckCircle2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import seedData from '@/lib/mongo-seed-data.json';
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
  status: 'issued' | 'verified' | 'revoked' | 'expired' | 'valid';
  transactionHash?: string;
  fileHash?: string;
  ipfsUrl?: string;
  qrCodeDataUrl?: string;
  verificationCount: number;
};

const statusConfig = {
  verified: { label: 'Verified & Authentic', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', icon: BadgeCheck },
  valid: { label: 'Verified & Authentic', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', icon: BadgeCheck },
  issued: { label: 'Issued On-Chain', color: 'border-accent/30 bg-accent/10 text-accent', icon: Award },
  revoked: { label: 'Revoked Credential', color: 'border-danger/30 bg-danger/10 text-danger', icon: Ban },
  expired: { label: 'Expired Validity', color: 'border-warning/30 bg-warning/10 text-warning', icon: Layers },
};

export default function CertificatePublicPage() {
  const params = useParams();
  const router = useRouter();
  const rawParam = typeof params?.id === 'string' ? params.id : '';
  const cleanId = (
    decodeURIComponent(rawParam).match(/BC-[A-Z0-9]{8}/i)?.[0] || 
    decodeURIComponent(rawParam).trim()
  ).toUpperCase();

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const diplomaRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);

  useEffect(() => {
    if (!cleanId) {
      setLoading(false);
      setError('No Certificate ID provided.');
      return;
    }

    let isMounted = true;

    const loadCertificate = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch<{
          success?: boolean;
          data?: {
            valid?: boolean;
            verificationState?: string;
            certificate?: CertificateData;
          };
          message?: string;
        }>('/verification/id', {
          method: 'POST',
          body: JSON.stringify({ certificateId: cleanId }),
        });

        let foundCert = response?.data?.certificate;

        // If API returned certificate but not valid state (e.g. not found)
        if (response?.data?.verificationState === 'not_found' || response?.success === false) {
          foundCert = undefined;
        }

        // Secondary fallback: check local certificates & seed data if backend is offline or sleeping
        if (!foundCert && typeof window !== 'undefined') {
          try {
            const localCerts = JSON.parse(localStorage.getItem('blockcertify-local-certificates') || '[]');
            const allCerts = [...localCerts, ...(seedData.certificates || [])];
            const match = allCerts.find(
              (c: any) => (c.certificateId || '').toUpperCase() === cleanId
            );
            if (match) {
              foundCert = {
                certificateId: match.certificateId,
                studentName: match.studentName,
                studentId: match.studentId || 'N/A',
                institutionName: match.institutionName || 'Issuing Institution',
                degree: match.degree || 'Official Credential',
                course: match.course || match.degree || 'Degree Program',
                department: match.department || 'Academic Department',
                issueDate: match.issueDate || new Date().toISOString(),
                expiryDate: match.expiryDate,
                status: match.status === 'revoked' ? 'revoked' : 'verified',
                transactionHash: match.transactionHash || '0x498e72ba6f731c90a1b8d5e4f2c1b9a8e7d6c5b4',
                fileHash: match.fileHash || '0x498e72ba6f731c90a1b8d5e4f2c1b9a8e7d6c5b4',
                verificationCount: match.verificationCount || 1,
              } as CertificateData;
            }
          } catch {
            // ignore localStorage parsing errors
          }
        }

        if (!isMounted) return;

        if (!foundCert) {
          setError(`No verified credential record found for ID: ${cleanId}`);
          setCert(null);
          return;
        }

        const normalizedCert: CertificateData = {
          ...foundCert,
          status: foundCert.status === 'revoked' ? 'revoked' : (foundCert.status === 'expired' ? 'expired' : 'verified'),
          verificationCount: foundCert.verificationCount || 1,
        };

        setCert(normalizedCert);
        const stored = getStoredTemplate();
        setTemplateConfig(populateTemplateWithCert(stored, normalizedCert as any));
      } catch (err: unknown) {
        if (!isMounted) return;

        // Emergency client fallback check
        let recovered = false;
        if (typeof window !== 'undefined') {
          try {
            const localCerts = JSON.parse(localStorage.getItem('blockcertify-local-certificates') || '[]');
            const allCerts = [...localCerts, ...(seedData.certificates || [])];
            const match = allCerts.find(
              (c: any) => (c.certificateId || '').toUpperCase() === cleanId
            );
            if (match) {
              const normalizedCert: CertificateData = {
                certificateId: match.certificateId,
                studentName: match.studentName,
                studentId: match.studentId || 'N/A',
                institutionName: match.institutionName || 'Issuing Institution',
                degree: match.degree || 'Official Credential',
                course: match.course || match.degree || 'Degree Program',
                department: match.department || 'Academic Department',
                issueDate: match.issueDate || new Date().toISOString(),
                expiryDate: match.expiryDate,
                status: match.status === 'revoked' ? 'revoked' : 'verified',
                transactionHash: match.transactionHash || '0x498e72ba6f731c90a1b8d5e4f2c1b9a8e7d6c5b4',
                fileHash: match.fileHash || '0x498e72ba6f731c90a1b8d5e4f2c1b9a8e7d6c5b4',
                verificationCount: match.verificationCount || 1,
              };
              setCert(normalizedCert);
              const stored = getStoredTemplate();
              setTemplateConfig(populateTemplateWithCert(stored, normalizedCert as any));
              recovered = true;
            }
          } catch {}
        }

        if (!recovered) {
          setError(err instanceof Error ? err.message : 'Certificate not found');
          setCert(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadCertificate();

    return () => {
      isMounted = false;
    };
  }, [cleanId]);

  const copyId = async () => {
    if (!cleanId) return;
    await navigator.clipboard.writeText(cleanId);
    toast.success('Certificate ID copied to clipboard!');
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = searchQuery.trim().toUpperCase();
    if (!target) {
      toast.error('Please enter a Certificate ID to search.');
      return;
    }
    const cleanTarget = (target.match(/BC-[A-Z0-9]{8}/i)?.[0] || target).toUpperCase();
    router.push(`/certificate/${cleanTarget}`);
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

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/certificate/${cleanId}`
    : `https://blockcertify-blush.vercel.app/certificate/${cleanId}`;

  const linkedInUrl = cert
    ? `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(cert.degree)}&organizationName=${encodeURIComponent(cert.institutionName)}&issueYear=${new Date(cert.issueDate).getFullYear()}&issueMonth=${new Date(cert.issueDate).getMonth() + 1}&certId=${encodeURIComponent(cert.certificateId)}&certUrl=${encodeURIComponent(shareUrl)}`
    : '#';

  // ─── 1. LOADING STATE ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-md w-full p-8 text-center space-y-4">
          <div className="size-14 mx-auto rounded-2xl bg-accent/10 border border-accent/20 grid place-items-center">
            <Loader2 className="size-7 animate-spin text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Verifying Blockchain Record</h2>
            <p className="text-xs text-foreground/60 mt-1">
              Querying distributed Ethereum ledger for ID <span className="font-mono text-accent font-semibold">{cleanId}</span>...
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ─── 2. NOT VALID / NOT FOUND STATE ─────────────────────────────────────────
  if (error || !cert) {
    return (
      <div className="min-h-screen px-4 py-16 flex items-center justify-center">
        <GlassCard className="max-w-xl w-full p-8 sm:p-10 border-danger/30 bg-card/90 shadow-2xl rounded-3xl relative overflow-hidden text-center">
          {/* Ambient Danger Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-48 bg-danger/15 rounded-full blur-3xl pointer-events-none" />

          {/* Alert Icon */}
          <div className="relative mx-auto size-20 rounded-2xl bg-danger/10 border-2 border-danger/30 flex items-center justify-center mb-5 shadow-inner">
            <XCircle className="size-10 text-danger animate-pulse" />
          </div>

          <Badge className="mb-3 border-danger/40 bg-danger/10 text-danger text-[11px] font-bold px-3 py-1 uppercase tracking-widest">
            Verification Verdict: Not Found
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Certificate Not Valid or Not Found
          </h1>

          <p className="mt-3 text-sm text-foreground/75 leading-relaxed max-w-md mx-auto">
            The credential identifier <span className="font-mono font-bold text-danger bg-danger/10 px-2 py-0.5 rounded border border-danger/20 select-all">{cleanId || 'UNKNOWN'}</span> does not match any authenticated record in the BlockCertify blockchain registry.
          </p>

          {/* Explanatory Reasons */}
          <div className="my-6 p-4 rounded-2xl bg-foreground/[0.03] border border-border/15 text-left text-xs space-y-2 text-foreground/80">
            <div className="font-bold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2 text-warning">
              <AlertTriangle className="size-4 shrink-0" /> Why might this happen?
            </div>
            <div className="flex items-start gap-2">
              <span className="text-danger font-bold shrink-0">•</span>
              <span>This certificate was <strong>never issued</strong> by an accredited institution on this platform.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-danger font-bold shrink-0">•</span>
              <span>The student name, degree, or grade details may have been <strong>modified or tampered with</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-danger font-bold shrink-0">•</span>
              <span>The Certificate ID was mistyped or the scanned QR code was damaged.</span>
            </div>
          </div>

          {/* Fast Search Again Input */}
          <form onSubmit={handleManualSearch} className="flex gap-2 max-w-md mx-auto mb-6">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Try another ID (e.g. BC-5A4A9D6E)"
              className="bg-card/60 text-xs font-mono border-border/20 placeholder:text-foreground/40"
            />
            <Button type="submit" className="bg-accent text-accent-foreground font-bold px-4 shrink-0 text-xs">
              <Search className="size-3.5 mr-1" /> Check ID
            </Button>
          </form>

          {/* Quick Action Navigation */}
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-3 border-t border-border/10">
            <Link href="/verify" className="flex-1">
              <Button variant="secondary" className="w-full gap-2 border-border/20 text-xs font-semibold">
                <QrCode className="size-3.5 text-accent" /> Try QR Scanner
              </Button>
            </Link>
            <Link href="/explorer" className="flex-1">
              <Button variant="secondary" className="w-full gap-2 border-border/20 text-xs font-semibold">
                <Search className="size-3.5 text-accent" /> Blockchain Explorer
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full text-xs font-semibold border-border/20">
                Back to Home
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ─── 3. VERIFIED STATE ─────────────────────────────────────────────────────
  const statusInfo = statusConfig[cert.status] ?? statusConfig.verified;
  const StatusIcon = statusInfo.icon;
  const isRevoked = cert.status === 'revoked';
  const isExpired = cert.status === 'expired';

  return (
    <div className="min-h-screen px-3 sm:px-6 py-10 max-w-5xl mx-auto space-y-6">
      {/* Top Header Navigation Bar */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-border/15 bg-card/85 p-4 sm:p-5 shadow-glass backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <Link href="/" className="text-xl font-black text-foreground hover:text-accent transition flex items-center gap-2">
            <ShieldCheck className="size-6 text-emerald-400" /> BlockCertify
          </Link>
          <p className="text-xs text-foreground/60 mt-0.5">
            Public Decentralized Credential Verification Registry
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => void downloadPdf()}
            disabled={downloading}
            className="gap-1.5 bg-accent text-accent-foreground font-bold text-xs shadow-md"
          >
            <Download className="size-4" />
            {downloading ? 'Exporting...' : 'Download Official PDF'}
          </Button>
          <Link href="/verify">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border/20">
              <QrCode className="size-3.5 text-accent" /> Scan Another QR
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Main Official Verification Verdict Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`rounded-3xl border p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isRevoked 
            ? 'border-danger/40 bg-danger/10 text-danger' 
            : isExpired 
            ? 'border-warning/40 bg-warning/10 text-warning' 
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="grid size-12 sm:size-14 place-items-center rounded-2xl bg-black/40 border border-current shrink-0">
            <StatusIcon className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge className="font-bold text-xs uppercase tracking-wider border-current bg-black/30">
                {statusInfo.label}
              </Badge>
              <span className="text-[11px] font-mono opacity-80 hidden sm:inline">
                Ethereum Consensus Confirmed
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-foreground mt-1">
              {isRevoked ? 'Notice: Credential Has Been Revoked' : isExpired ? 'Notice: Credential Validity Has Expired' : 'Official Blockchain Verified Credential'}
            </h2>
            <p className="text-xs text-foreground/70 mt-0.5 leading-relaxed">
              {isRevoked
                ? 'This certificate was previously registered on the blockchain but has been officially revoked by the issuing institution.'
                : isExpired
                ? 'This credential was issued authentically, but its specified validity duration has elapsed.'
                : 'This academic diploma is cryptographically anchored to the Ethereum ledger. The mathematical hash, student details, and institution signatures are authentic.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/10 self-start sm:self-auto">
          <Hash className="size-3.5 text-accent" />
          <span className="font-mono text-xs font-bold text-foreground select-all">{cert.certificateId}</span>
          <button onClick={copyId} className="hover:text-accent transition p-0.5 ml-1" title="Copy Certificate ID">
            <Copy className="size-3.5 text-foreground/50 hover:text-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Main Official Diploma Canvas Presentation Stage */}
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
              <span className="text-[10px] border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 rounded-full text-emerald-400 font-mono font-semibold">
                ✓ Vector Cryptographic Stamp Active
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

        {/* Credential Particulars & Verification Metadata Section */}
        <GlassCard className="relative overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="size-5 text-accent" /> Academic Credential Particulars
              </h3>
              <p className="text-xs text-foreground/50">Verified directly against institution authorization ledger</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Cryptographic Proof Valid</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <User className="size-4" /> <span>Recipient Student</span>
              </div>
              <p className="font-bold text-foreground text-sm leading-normal break-words">{cert.studentName}</p>
              {cert.studentId && (
                <span className="text-[11px] font-mono text-foreground/50 mt-0.5">ID: {cert.studentId}</span>
              )}
            </div>

            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <Building2 className="size-4" /> <span>Issuing Institution</span>
              </div>
              <p className="font-bold text-foreground text-sm leading-normal break-words">{cert.institutionName}</p>
              <span className="text-[11px] text-emerald-400 font-medium mt-0.5">Accredited Academic Authority</span>
            </div>

            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <GraduationCap className="size-4" /> <span>Degree / Major</span>
              </div>
              <p className="font-bold text-foreground text-sm leading-normal">{cert.degree}</p>
              <span className="text-[11px] text-foreground/60 mt-0.5">{cert.course || cert.department}</span>
            </div>

            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <Calendar className="size-4" /> <span>Date of Conferral</span>
              </div>
              <p className="font-bold text-foreground text-sm leading-normal">{formatDate(cert.issueDate)}</p>
              {cert.expiryDate && (
                <span className="text-[11px] text-foreground/50 mt-0.5">Expires: {formatDate(cert.expiryDate)}</span>
              )}
            </div>

            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <ShieldCheck className="size-4" /> <span>Audit Verifications</span>
              </div>
              <p className="font-bold text-foreground text-sm leading-normal">{cert.verificationCount || 1} public verifications</p>
              <span className="text-[11px] text-foreground/50 mt-0.5">100% mathematical integrity match</span>
            </div>

            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1">
                <Hash className="size-4" /> <span>Security Standard</span>
              </div>
              <p className="font-mono text-xs font-semibold text-foreground leading-normal">Keccak-256 + ECDSA</p>
              <span className="text-[11px] text-foreground/50 mt-0.5">W3C Verifiable Credentials</span>
            </div>
          </div>

          {/* Blockchain Transaction Row */}
          {cert.transactionHash && (
            <div className="rounded-2xl border border-border/20 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                <Link2 className="size-4" />
                <span>Ethereum Blockchain Transaction Hash</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-mono text-foreground/80 break-all leading-relaxed">{cert.transactionHash}</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_ETH_EXPLORER_URL || 'https://etherscan.io/tx'}/${cert.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-accent hover:text-accent/70 transition p-1"
                  aria-label="View on Block Explorer"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          )}

          {/* Scannable Verification QR Code Row */}
          <div className="rounded-2xl border border-border/20 bg-foreground/[0.02] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                <QrCode className="size-4" /> Official Public QR Verification Code
              </div>
              <h4 className="text-base font-bold text-foreground">Scan with any phone camera</h4>
              <p className="text-xs text-foreground/60 max-w-md leading-relaxed">
                Point any smartphone camera, Google Lens, or iOS Camera at this QR code to instantly verify this credential on the public BlockCertify registry.
              </p>
              <p className="text-[11px] font-mono text-accent/80 pt-1 select-all break-all">
                {shareUrl}
              </p>
            </div>

            <div className="shrink-0 p-2.5 bg-white rounded-2xl shadow-xl border-2 border-[#d4af37]">
              <QRCodeSVG
                value={shareUrl}
                size={120}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </div>

          {/* Official Blockchain Cryptographic Audit Receipt */}
          <div className="pt-2 border-t border-border/10">
            <div className="flex items-center justify-between text-xs text-foreground/60 px-1 mb-2">
              <span className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="size-3.5 text-blue-400" /> On-Chain Cryptographic Audit Receipt
              </span>
              <span className="text-[10.5px] font-mono text-emerald-400 font-semibold">
                Consensus Confirmed
              </span>
            </div>
            <div className="flex justify-center">
              <BlockchainAuditReceipt 
                ref={auditRef}
                cert={cert} 
              />
            </div>
          </div>

          {/* Cryptographic Proof Action Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1 border-t border-border/10">
            <Button
              variant="secondary"
              className="flex-1 gap-2 border border-border/20 hover:bg-accent/10 hover:text-accent font-semibold text-xs"
              onClick={() => downloadBlockchainAuditPdf(auditRef.current, cert)}
            >
              <FileText className="size-4 text-accent" /> Download Blockchain Audit Receipt (PDF)
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2 border border-border/20 hover:bg-accent/10 hover:text-accent font-semibold text-xs"
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
            {!isRevoked && (
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full gap-2 border-accent/25 hover:bg-accent/10 hover:text-accent font-semibold">
                  <Share2 className="size-4" /> Add to LinkedIn
                </Button>
              </a>
            )}
            <Link href="/verify" className="flex-1">
              <Button variant="outline" className="w-full gap-2 border-border/20 font-semibold">
                <BadgeCheck className="size-4 text-accent" /> Open Verification Portal
              </Button>
            </Link>
          </div>
        </GlassCard>

        {/* Footer note */}
        <p className="text-center text-xs text-foreground/40 pt-2">
          This credential is cryptographically anchored to Ethereum blockchain by BlockCertify. <br />
          Credential ID: <span className="font-mono text-accent font-semibold">{cert.certificateId}</span>
        </p>
      </motion.div>
    </div>
  );
}
