"use client";

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { BadgeCheck, Ban, Layers, Link2, LoaderCircle, QrCode, Search, ShieldCheck, Download, Award, Sparkles, ExternalLink, FileText, Upload, Eye, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const QRScanner = dynamic(() => import('@/components/qr-scanner').then((mod) => mod.QRScanner), { ssr: false });

type VerifyMode = 'id' | 'hash' | 'transaction' | 'qr' | 'bulk';

type VerificationResult = {
  valid: boolean;
  error?: string;
  certificate?: {
    certificateId: string;
    studentName: string;
    institutionName: string;
    issueDate: string;
    status: string;
    fileHash?: string;
    transactionHash?: string;
    degree?: string;
    course?: string;
    department?: string;
    studentId?: string;
    grade?: string;
    approvedBy?: string;
    expiryDate?: string;
  };
};

type BulkVerificationEntry = {
  certificateId: string;
  success: boolean;
  error?: string;
  data?: { valid: boolean; certificate?: VerificationResult['certificate'] };
};

export function VerificationWidget() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<VerifyMode>('id');
  const [value, setValue] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkVerificationEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifiedTab, setVerifiedTab] = useState<'diploma' | 'details'>('diploma');
  const diplomaRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);

  const verifiedTemplateConfig = useMemo(() => {
    if (!result?.certificate) return null;
    const stored = getStoredTemplate();
    return populateTemplateWithCert(stored, result.certificate as any);
  }, [result?.certificate]);

  useEffect(() => {
    const queryId = searchParams.get('id');
    if (queryId) {
      setMode('id');
      setValue(queryId);
      // Wait a moment for state to settle, then verify
      setTimeout(() => verify(queryId), 100);
    }
  }, [searchParams]);

  const downloadPdf = async () => {
    if (!diplomaRef.current || !result?.certificate) return;
    
    try {
      setLoading(true);
      await downloadDiplomaPdf(
        diplomaRef.current,
        `BlockCertify_Verified_${(result.certificate.studentName || 'Diploma').replace(/\s+/g, '_')}_${result.certificate.certificateId}.pdf`
      );
    } catch {
      toast.error('Failed to generate Diploma PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (overridePayload?: string, overrideMode?: Exclude<VerifyMode, 'bulk'>) => {
    setLoading(true);
    try {
      const activeMode = overrideMode || (mode === 'bulk' ? 'id' : mode);
      const payload = overridePayload !== undefined ? overridePayload : value;
      if (!payload || !payload.trim()) {
        toast.error('Please enter a value to verify.');
        setLoading(false);
        return;
      }
      const routeMap = {
        id: '/verification/id',
        hash: '/verification/hash',
        transaction: '/verification/transaction',
        qr: '/verification/qr',
      } satisfies Record<Exclude<VerifyMode, 'bulk'>, string>;
      const body = activeMode === 'id' ? { certificateId: payload.trim() } : activeMode === 'hash' ? { hash: payload.trim() } : activeMode === 'transaction' ? { transactionHash: payload.trim() } : { payload: payload.trim() };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${routeMap[activeMode]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { data?: VerificationResult; message?: string };
      if (!response.ok || !data.data) throw new Error(data.message || 'Verification failed');
      setResult(data.data);
      toast.success('Certificate verified successfully!');
    } catch (error) {
      setResult({ valid: false, error: error instanceof Error ? error.message : 'Verification failed' });
      toast.error('Unable to verify credential.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      toast.info('Calculating file hash (SHA-256)...');
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setValue(hashHex);
      toast.success(`Hash calculated: ${hashHex.slice(0, 16)}...`);
      await verify(hashHex, 'hash');
    } catch {
      toast.error('Failed to calculate document hash.');
    } finally {
      setLoading(false);
    }
  };

  const verifyBulk = async () => {
    const lines = bulkValue.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error('Please enter at least one certificate ID.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateIds: lines }),
      });
      const data = (await response.json()) as { data?: BulkVerificationEntry[]; message?: string };
      if (!response.ok || !data.data) throw new Error(data.message || 'Bulk verification failed');
      setBulkResults(data.data);
      const firstValid = data.data.find((e) => e.success && e.data?.valid && e.data?.certificate);
      if (firstValid?.data) {
        setResult(firstValid.data);
      }
      toast.success(`Verified ${data.data.length} certificates.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newMode: VerifyMode) => {
    setMode(newMode);
    if (newMode === 'id') {
      setValue(result?.certificate?.certificateId || 'BC-5A4A9D6E');
    } else if (newMode === 'hash') {
      setValue(result?.certificate?.fileHash || '889fb97aa16aa8ffad7499c307801a737f40ea8686049fefd90c5bff48d3c810');
    } else if (newMode === 'transaction') {
      setValue(result?.certificate?.transactionHash || '0x4cfcfeb4467d1c98f4d1ffde259a85befef057f162991a255ace0261430d1820');
    } else if (newMode === 'bulk') {
      if (!bulkValue) {
        setBulkValue(result?.certificate?.certificateId ? `${result.certificate.certificateId}\nBC-5A4A9D6E` : 'BC-5A4A9D6E\nBC-5383A1E9');
      }
    }
  };

  const tabs = [
    { key: 'id' as const, label: 'Certificate ID', icon: Search },
    { key: 'qr' as const, label: 'Scan QR Code', icon: QrCode },
    { key: 'hash' as const, label: 'Document Hash', icon: ShieldCheck },
    { key: 'transaction' as const, label: 'Transaction Hash', icon: Link2 },
    { key: 'bulk' as const, label: 'Bulk Verification', icon: Layers },
  ];

  const status = useMemo(() => {
    if (loading) {
      return {
        title: 'Verifying with Ethereum Network...',
        description: 'Querying smart contracts, IPFS storage, and university registry.',
        icon: <LoaderCircle className="size-6 animate-spin text-accent" />,
        iconClassName: 'border border-accent/30 bg-accent/10',
      };
    }
    if (mode === 'bulk' && bulkResults) {
      const validCount = bulkResults.filter((r) => r.success && r.data?.valid).length;
      return {
        title: `Bulk Results: ${validCount} / ${bulkResults.length} Valid`,
        description: 'Batch cryptographic verification complete. Select any certificate below to inspect or download.',
        icon: <Layers className="size-6 text-accent" />,
        iconClassName: 'border border-accent/30 bg-accent/10',
      };
    }
    if (result?.valid && result.certificate) {
      return {
        title: 'Verified Digital Credential',
        description: 'Authentic document anchored to the blockchain network.',
        icon: <BadgeCheck className="size-6 text-success" />,
        iconClassName: 'border border-success/30 bg-success/10',
      };
    }
    if (result?.error) {
      return {
        title: 'Credential Not Verified',
        description: result.error,
        icon: <Ban className="size-6 text-danger" />,
        iconClassName: 'border border-danger/30 bg-danger/10',
      };
    }
    return {
      title: 'Awaiting Document Input',
      description: 'Choose a verification method on the left to begin cryptographic check.',
      icon: <ShieldCheck className="size-6 text-accent" />,
      iconClassName: 'border border-accent/30 bg-accent/10',
    };
  }, [loading, result, mode, bulkResults]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <GlassCard>
        <div className="mb-5 text-xl font-semibold">Verify a certificate</div>
        <div className="grid grid-cols-2 gap-2 relative">
          {tabs.map((tab) => {
            const isActive = mode === tab.key;
            return (
              <button 
                key={tab.key} 
                onClick={() => handleTabChange(tab.key)} 
                className="relative rounded-2xl p-4 text-left text-sm transition duration-200 border border-border/10 bg-foreground/[0.02] hover:bg-foreground/[0.05] active:scale-98 overflow-hidden group focus-visible:ring-2 focus-visible:ring-accent"
              >
                {isActive && (
                  <motion.span 
                    layoutId="activeVerificationMode" 
                    className="absolute inset-0 rounded-2xl border border-accent/40 bg-accent/15 shadow-glow"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-start">
                  <tab.icon className={`mb-3 size-5 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-foreground/40 group-hover:text-foreground'}`} />
                  <span className={`font-semibold transition-colors duration-200 ${isActive ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'}`}>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        {mode === 'qr' ? (
          <div className="mt-5 space-y-4">
            <QRScanner onScan={(decodedText) => verify(decodedText, 'qr')} />
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  const id = result?.certificate?.certificateId || 'BC-5A4A9D6E';
                  verify(id, 'qr');
                }}
                className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Try Demo QR Verification ({result?.certificate?.certificateId || 'BC-5A4A9D6E'})
              </button>
            </div>
          </div>
        ) : mode === 'bulk' ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <span>Enter Certificate IDs (one per line):</span>
              <button
                type="button"
                onClick={() => setBulkValue('BC-5A4A9D6E\nBC-5383A1E9')}
                className="text-accent hover:underline font-semibold"
              >
                Fill Sample IDs
              </button>
            </div>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-border/15 bg-foreground/[0.03] p-3 text-sm text-foreground placeholder:text-foreground/45 outline-none transition focus:border-accent/60 focus:bg-foreground/[0.05] focus:ring-2 focus:ring-accent/20"
              placeholder={'BC-1A2B3C4D\nBC-5E6F7A8B'}
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              aria-label="Bulk certificate IDs"
            />
            <Button onClick={() => verifyBulk()} disabled={loading} className="w-full">{loading ? 'Verifying...' : 'Verify all'}</Button>
          </div>
        ) : mode === 'hash' ? (
          <div className="mt-5 space-y-4">
            <div className="p-3.5 rounded-2xl border border-dashed border-accent/40 bg-accent/5 text-center flex flex-col items-center justify-center gap-1.5 transition hover:bg-accent/10">
              <Upload className="size-5 text-accent" />
              <label className="text-xs font-bold text-accent cursor-pointer hover:underline">
                Upload Certificate File to Auto-Verify
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileUpload} />
              </label>
              <p className="text-[10.5px] text-foreground/50">Calculates SHA-256 hash automatically in browser</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-foreground/40 justify-center">
              <span className="h-px bg-border/20 flex-1" />
              <span>OR ENTER HASH MANUALLY</span>
              <span className="h-px bg-border/20 flex-1" />
            </div>

            <Input 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              placeholder="0x... or 64-char sha256 hash" 
              aria-label="Blockchain Hash" 
            />

            <div className="flex items-center justify-between text-[11.5px]">
              <button 
                type="button" 
                onClick={() => { 
                  const h = '889fb97aa16aa8ffad7499c307801a737f40ea8686049fefd90c5bff48d3c810'; 
                  setValue(h); 
                  verify(h, 'hash'); 
                }} 
                className="font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Try Demo Hash
              </button>
              {result?.certificate?.fileHash && (
                <button 
                  type="button" 
                  onClick={() => { 
                    setValue(result.certificate!.fileHash!); 
                    verify(result.certificate!.fileHash!, 'hash'); 
                  }} 
                  className="text-foreground/60 hover:text-foreground"
                >
                  Use Active Cert Hash
                </button>
              )}
            </div>

            <Button onClick={() => verify(value, 'hash')} disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Verify Hash'}
            </Button>
          </div>
        ) : mode === 'transaction' ? (
          <div className="mt-5 space-y-4">
            <Input 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              placeholder="0x transaction hash (66 chars)" 
              aria-label="Transaction Hash" 
            />

            <div className="flex items-center justify-between text-[11.5px]">
              <button 
                type="button" 
                onClick={() => { 
                  const tx = '0x4cfcfeb4467d1c98f4d1ffde259a85befef057f162991a255ace0261430d1820'; 
                  setValue(tx); 
                  verify(tx, 'transaction'); 
                }} 
                className="font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Try Demo Tx Hash
              </button>
              {result?.certificate?.transactionHash && (
                <button 
                  type="button" 
                  onClick={() => { 
                    setValue(result.certificate!.transactionHash!); 
                    verify(result.certificate!.transactionHash!, 'transaction'); 
                  }} 
                  className="text-foreground/60 hover:text-foreground"
                >
                  Use Active Cert Tx
                </button>
              )}
            </div>

            <Button onClick={() => verify(value, 'transaction')} disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Verify Transaction'}
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <Input 
              value={value} 
              onChange={(e) => setValue(e.target.value)} 
              placeholder="BC-XXXXXXX" 
              aria-label="Certificate ID" 
            />

            <div className="flex items-center justify-between text-[11.5px]">
              <button 
                type="button" 
                onClick={() => { 
                  const id = 'BC-5A4A9D6E'; 
                  setValue(id); 
                  verify(id, 'id'); 
                }} 
                className="font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Try Demo ID (BC-5A4A9D6E)
              </button>
            </div>

            <Button onClick={() => verify(value, 'id')} disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Verify now'}
            </Button>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="mb-5 flex items-center gap-3">
          <div className={`grid size-12 place-items-center rounded-2xl ${status.iconClassName}`}>{status.icon}</div>
          <div>
            <div className="text-xl font-semibold">{status.title}</div>
            <p className="text-sm text-foreground/65">{status.description}</p>
          </div>
        </div>

        {mode === 'bulk' && bulkResults && (
          <div className="space-y-3 mb-6">
            <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
              Batch Verification List ({bulkResults.length})
            </div>
            <div className="grid gap-2.5 max-h-64 overflow-y-auto pr-1">
              {bulkResults.map((entry) => {
                const isSelected = result?.certificate?.certificateId === entry.certificateId;
                return (
                  <div 
                    key={entry.certificateId} 
                    className={`rounded-xl border p-3 transition ${
                      isSelected 
                        ? 'border-accent/60 bg-accent/10 shadow-sm' 
                        : 'border-border/15 bg-foreground/[0.02] hover:bg-foreground/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-xs font-bold text-foreground">{entry.certificateId}</div>
                      {entry.success && entry.data?.valid ? (
                        <span className="rounded-md border border-success/40 bg-success/15 px-2 py-0.5 text-[10.5px] font-bold text-success flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Valid
                        </span>
                      ) : (
                        <span className="rounded-md border border-danger/40 bg-danger/15 px-2 py-0.5 text-[10.5px] font-bold text-danger">
                          {entry.success ? 'Invalid' : entry.error || 'Not found'}
                        </span>
                      )}
                    </div>
                    {entry.data?.certificate && (
                      <div className="mt-2 text-xs text-foreground/70 flex items-center justify-between">
                        <span>{entry.data.certificate.studentName} · {entry.data.certificate.institutionName}</span>
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "secondary"}
                          className="h-7 text-[10.5px] px-2.5 gap-1.5 font-bold ml-2"
                          onClick={() => {
                            if (entry.data?.certificate) {
                              setResult(entry.data);
                              toast.success(`Loaded certificate ${entry.certificateId} below.`);
                            }
                          }}
                        >
                          <Eye className="size-3" /> {isSelected ? 'Viewing' : 'Show & Download'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {result?.certificate ? (
          <div className="space-y-4">
            <div className="flex p-1 bg-card/80 border border-border/15 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setVerifiedTab('diploma')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  verifiedTab === 'diploma'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Award className="size-3.5" /> Official Master Diploma
              </button>
              <button
                type="button"
                onClick={() => setVerifiedTab('details')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  verifiedTab === 'details'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <ShieldCheck className="size-3.5" /> Blockchain Details
              </button>
            </div>

            {/* TAB 1: OFFICIAL MASTER DIPLOMA CANVAS */}
            <div className={verifiedTab === 'diploma' ? 'space-y-2' : 'hidden'}>
              <div className="flex items-center justify-between text-xs text-foreground/60 px-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="size-3 text-accent" /> Verified Academic Diploma (Master Layout)
                </span>
                <span className="text-[10.5px] font-mono text-accent font-semibold">
                  A4 Landscape 300+ DPI
                </span>
              </div>

              {verifiedTemplateConfig && (
                <div className="rounded-2xl p-2 sm:p-3 bg-[#050811] border border-border/20 shadow-2xl flex items-center justify-center">
                  <div className="w-full max-w-[560px]">
                    <OfficialDiplomaCanvas 
                      ref={diplomaRef}
                      config={verifiedTemplateConfig}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hidden persistent diploma canvas for background PDF export when on Details tab */}
            {verifiedTab === 'details' && verifiedTemplateConfig && (
              <div className="sr-only pointer-events-none" aria-hidden="true">
                <div className="w-[560px]">
                  <OfficialDiplomaCanvas 
                    ref={diplomaRef}
                    config={verifiedTemplateConfig}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BLOCKCHAIN REGISTRY DETAILS */}
            <div className={verifiedTab === 'details' ? 'space-y-3' : 'hidden'}>
              <div className="flex items-center justify-between text-xs text-foreground/60 px-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="size-3.5 text-blue-400" /> On-Chain Verification Audit Record
                </span>
                <span className="text-[10.5px] font-mono text-emerald-400 font-semibold">
                  Ethereum Consensus Verified
                </span>
              </div>

              <div className="flex justify-center">
                <BlockchainAuditReceipt 
                  ref={auditRef}
                  cert={result.certificate} 
                />
              </div>
            </div>

            {/* Offscreen persistent audit receipt for background PDF export when on Diploma tab */}
            {verifiedTab === 'diploma' && result.certificate && (
              <div 
                style={{ position: 'fixed', left: '-99999px', top: 0, width: '740px', pointerEvents: 'none' }} 
                aria-hidden="true"
              >
                <BlockchainAuditReceipt 
                  ref={auditRef}
                  cert={result.certificate} 
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {verifiedTab === 'diploma' ? (
                <>
                  <Button 
                    onClick={downloadPdf} 
                    disabled={loading}
                    className="flex-1 gap-2 rounded-xl h-11 shadow-sm font-bold bg-accent text-accent-foreground hover:brightness-110 transition-all"
                  >
                    <Download className="size-4" /> {loading ? 'Exporting...' : 'Download Official Diploma PDF'}
                  </Button>
                  <Button
                    onClick={() => downloadBlockchainAuditPdf(auditRef.current, result.certificate)}
                    variant="secondary"
                    className="gap-2 rounded-xl h-11 font-semibold border border-border/20 hover:bg-foreground/[0.05]"
                  >
                    <FileText className="size-4 text-accent" /> Audit Receipt (PDF)
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => downloadBlockchainAuditPdf(auditRef.current, result.certificate)} 
                    disabled={loading}
                    className="flex-1 gap-2 rounded-xl h-11 shadow-sm font-bold bg-accent text-accent-foreground hover:brightness-110 transition-all"
                  >
                    <FileText className="size-4" /> Download Audit Receipt (PDF)
                  </Button>
                  <Button
                    onClick={() => result.certificate && exportBlockchainProofJson(result.certificate)}
                    variant="secondary"
                    className="gap-2 rounded-xl h-11 font-semibold border border-border/20 hover:bg-foreground/[0.05]"
                  >
                    <Download className="size-4 text-accent" /> Export Proof (JSON)
                  </Button>
                </>
              )}
              <Link 
                href={`/certificate/${result.certificate.certificateId}`} 
                target="_blank"
                className="sm:w-auto"
              >
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto gap-2 rounded-xl h-11 font-semibold border border-border/20 hover:bg-foreground/[0.05]"
                >
                  <ExternalLink className="size-4 text-accent" /> Public Page
                </Button>
              </Link>
            </div>
          </div>
        ) : result?.error ? (
          <div className="rounded-3xl border border-danger/20 bg-danger/10 p-5 text-sm text-danger">{result.error}</div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/12 bg-foreground/[0.02] p-10 text-center text-foreground/55">Scan a QR code or submit a lookup key to see certificate preview, institution details, blockchain status, issue date, expiry date, and IPFS proof.</div>
        )}
      </GlassCard>
    </div>
  );
}
