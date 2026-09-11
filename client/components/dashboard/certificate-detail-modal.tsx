"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Building2, Calendar, Check, Copy, Download, ExternalLink,
  GraduationCap, Hash, Link2, QrCode, Share2, X, BadgeCheck, Ban, Layers, ShieldCheck, Sparkles, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import type { Certificate } from '@/types';
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

const statusStyles: Record<string, string> = {
  verified: 'border-success/30 bg-success/10 text-success',
  issued: 'border-accent/30 bg-accent/10 text-accent',
  revoked: 'border-danger/30 bg-danger/10 text-danger',
  expired: 'border-warning/30 bg-warning/10 text-warning',
};

const statusIcons: Record<string, React.ReactNode> = {
  verified: <BadgeCheck className="size-5" />,
  issued: <Award className="size-5" />,
  revoked: <Ban className="size-5" />,
  expired: <Layers className="size-5" />,
};

interface CertificateDetailModalProps {
  certificate: Certificate;
  onClose: () => void;
}

export function CertificateDetailModal({ certificate, onClose }: CertificateDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'diploma' | 'details'>('diploma');
  const diplomaRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(() => 
    populateTemplateWithCert(getStoredTemplate(), certificate)
  );

  useEffect(() => {
    const stored = getStoredTemplate();
    setTemplateConfig(populateTemplateWithCert(stored, certificate));
  }, [certificate]);

  const certStyle = statusStyles[certificate.status] ?? statusStyles.issued;
  const certIcon = statusIcons[certificate.status] ?? statusIcons.issued;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/certificate/${certificate.certificateId}`
    : '';

  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION&name=${encodeURIComponent(certificate.degree)}&organizationName=${encodeURIComponent(certificate.institutionName)}&issueYear=${new Date(certificate.issueDate).getFullYear()}&issueMonth=${new Date(certificate.issueDate).getMonth() + 1}&certId=${encodeURIComponent(certificate.certificateId)}&certUrl=${encodeURIComponent(shareUrl)}`;

  const copyCertId = async () => {
    await navigator.clipboard.writeText(certificate.certificateId);
    setCopied(true);
    toast.success('Certificate ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!diplomaRef.current) return;
    setDownloading(true);
    try {
      await downloadDiplomaPdf(
        diplomaRef.current,
        `BlockCertify_${(certificate.studentName || 'Diploma').replace(/\s+/g, '_')}_${certificate.certificateId}.pdf`
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[2rem] border border-border/20 bg-card/95 shadow-2xl backdrop-blur-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/10 bg-card/90 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn('grid size-10 place-items-center rounded-2xl border', certStyle)}>
                {certIcon}
              </div>
              <div>
                <div className="font-bold text-foreground text-sm sm:text-base leading-tight">
                  {certificate.degree}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={cn('capitalize text-[10px] py-0 px-1.5', certStyle)}>
                    {certificate.status}
                  </Badge>
                  <span className="text-xs text-foreground/50 font-mono hidden sm:inline">
                    {certificate.certificateId}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-xl text-foreground/50 hover:bg-foreground/[0.06] hover:text-foreground transition"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* View Tab Switcher */}
          <div className="flex p-1 bg-card/80 border-b border-border/10 gap-1 px-4 sm:px-6 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('diploma')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'diploma'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]'
              }`}
            >
              <Award className="size-3.5" /> Official Master Diploma (Designed Layout)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'details'
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]'
              }`}
            >
              <ShieldCheck className="size-3.5" /> Blockchain Registry & Details
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* TAB 1: OFFICIAL DESIGNED DIPLOMA CANVAS */}
            <div className={activeTab === 'diploma' ? 'space-y-3' : 'hidden'}>
              <div className="flex items-center justify-between text-xs text-foreground/60">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="size-3.5 text-accent" /> Authentic University Degree Diploma (A4 Landscape 300+ DPI)
                </span>
                <span className="font-mono text-[11px] text-accent font-semibold hidden sm:inline">
                  Verified On-Chain
                </span>
              </div>

              {/* Live Diploma Presentation Stage */}
              <div className="rounded-2xl p-2.5 sm:p-4 bg-[#050811] border border-border/20 shadow-2xl flex items-center justify-center">
                <div className="w-full max-w-[620px]">
                  <OfficialDiplomaCanvas 
                    ref={diplomaRef}
                    config={templateConfig} 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-foreground/50 pt-1 px-1">
                <span>🎓 Rendered using Gautam Buddha University Master Academic Template</span>
                <button
                  onClick={() => void copyCertId()}
                  className="hover:text-accent flex items-center gap-1 font-mono transition"
                >
                  <Copy className="size-3" /> {certificate.certificateId}
                </button>
              </div>
            </div>

            {/* Hidden persistent diploma canvas for background PDF export when on Details tab */}
            {activeTab === 'details' && (
              <div className="sr-only pointer-events-none" aria-hidden="true">
                <div className="w-[620px]">
                  <OfficialDiplomaCanvas 
                    ref={diplomaRef}
                    config={templateConfig} 
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BLOCKCHAIN REGISTRY & DETAILS */}
            <div className={activeTab === 'details' ? 'space-y-4' : 'hidden'}>
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
                  cert={certificate} 
                />
              </div>

              {/* Audit proof download bar */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border/10">
                <Button
                  variant="secondary"
                  className="flex-1 gap-2 border border-border/20 hover:bg-accent/10 hover:text-accent font-semibold"
                  onClick={() => downloadBlockchainAuditPdf(auditRef.current, certificate)}
                >
                  <FileText className="size-4 text-accent" /> Download Audit Receipt (PDF)
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 gap-2 border border-border/20 hover:bg-accent/10 hover:text-accent font-semibold"
                  onClick={() => exportBlockchainProofJson(certificate)}
                >
                  <Download className="size-4 text-accent" /> Export Proof (JSON)
                </Button>
              </div>
            </div>

            {/* Offscreen persistent audit receipt for background PDF export when on Diploma tab */}
            {activeTab === 'diploma' && (
              <div 
                style={{ position: 'fixed', left: '-99999px', top: 0, width: '740px', pointerEvents: 'none' }} 
                aria-hidden="true"
              >
                <BlockchainAuditReceipt 
                  ref={auditRef}
                  cert={certificate} 
                />
              </div>
            )}
          </div>

          {/* Action footer */}
          <div className="sticky bottom-0 border-t border-border/10 bg-card/90 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row gap-2.5 shrink-0">
            {activeTab === 'diploma' ? (
              <Button
                className="flex-1 gap-2 bg-accent text-accent-foreground font-bold shadow-md hover:brightness-110"
                onClick={() => void handleDownloadPdf()}
                disabled={downloading}
              >
                <Download className="size-4" />
                {downloading ? 'Exporting Master Diploma...' : 'Download Official Diploma PDF'}
              </Button>
            ) : (
              <Button
                className="flex-1 gap-2 bg-accent text-accent-foreground font-bold shadow-md hover:brightness-110"
                onClick={() => downloadBlockchainAuditPdf(auditRef.current, certificate)}
              >
                <FileText className="size-4" />
                Download Blockchain Audit Receipt (PDF)
              </Button>
            )}
            {certificate.status !== 'revoked' && (
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto gap-2 border-accent/25 hover:bg-accent/10 hover:text-accent">
                  <Share2 className="size-4" /> Add to LinkedIn
                </Button>
              </a>
            )}
            <a
              href={`/certificate/${certificate.certificateId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sm:w-auto"
            >
              <Button variant="outline" className="w-full sm:w-auto gap-2 border-border/20">
                <ShieldCheck className="size-4 text-accent" /> Public Page
              </Button>
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
