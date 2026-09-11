
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  FileText, 
  UploadCloud, 
  X, 
  Sparkles,
  CheckCircle2,
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getSubscriptionTier, SubscriptionTier } from '@/lib/subscription';

const defaultState = {
  studentName: '',
  studentId: '',
  email: '',
  degree: '',
  course: '',
  department: '',
  grade: '',
  approvedBy: '',
  institutionId: '',
  institutionName: '',
  graduationYear: new Date().getFullYear(),
  issueDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
};

export function CertificateIssuanceForm({ onCompleted }: { onCompleted?: () => void }) {
  const { data: session } = useSession();
  const [values, setValues] = useState(defaultState);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [issuedCount, setIssuedCount] = useState(0);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accessToken = session?.user?.accessToken;
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isUnapprovedInstitution = session?.user?.role === 'institution' && session.user.institutionStatus !== 'approved';

  useEffect(() => {
    if (userId) {
      setTier(getSubscriptionTier(userId));
    }
  }, [userId]);

  const loadCertificateCount = useCallback(() => {
    if (!accessToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/certificates?limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.total !== undefined) {
          setIssuedCount(data.data.total);
        }
      })
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    loadCertificateCount();
  }, [loadCertificateCount]);

  const isLimitReached = tier === 'free' && issuedCount >= 3;

  const onChange = (key: keyof typeof defaultState, value: string | number) => setValues((current) => ({ ...current, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Only PDF documents (.pdf) are accepted.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('PDF file size exceeds 10MB limit.');
        return;
      }
      setFile(selected);
      toast.success(`PDF attached: ${selected.name}`);
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Only PDF documents (.pdf) are accepted.');
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('PDF file size exceeds 10MB limit.');
        return;
      }
      setFile(selected);
      toast.success(`PDF attached: ${selected.name}`);
    }
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    onChange('issueDate', today);
    toast.info("Issue Date set to today");
  };

  const handleSetLifetime = () => {
    onChange('expiryDate', '');
    toast.info("Expiry cleared (Permanent lifetime validity)");
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLimitReached) {
      toast.error('Limit reached. Please upgrade to issue more certificates.');
      return;
    }
    if (!accessToken) {
      toast.error('Please sign in to issue certificates.');
      return;
    }
    if (!file) {
      toast.error('Please attach the certificate PDF file.');
      return;
    }
    const required: (keyof typeof defaultState)[] = ['studentName', 'studentId', 'email', 'degree', 'course', 'department', 'institutionId', 'institutionName'];
    for (const field of required) {
      if (!String(values[field]).trim()) {
        toast.error(`Please fill in the "${field.replace(/([A-Z])/g, ' $1').toLowerCase()}" field.`);
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)));
      formData.append('certificatePdf', file);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/certificates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Issuance failed');
      toast.success(`Certificate ${result.data.certificateId} anchored successfully!`);
      setValues(defaultState);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadCertificateCount();
      onCompleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Issuance failed');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <GlassCard className="p-5 md:p-6 rounded-2xl border-border/12 shadow-glass">
      
      {/* Header Bar */}
      <div className="mb-4 pb-3 border-b border-border/10">
        <h3 className="text-lg font-bold text-foreground">Issue Certificate</h3>
        <p className="text-xs text-foreground/65 mt-0.5">
          Fill details, select conferral date, and attach signed PDF.
        </p>
      </div>

      {isUnapprovedInstitution ? (
        <div className="mb-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning flex items-center gap-2">
          <Info className="size-4 shrink-0" />
          <span>Institution pending approval. Issuance disabled.</span>
        </div>
      ) : null}

      {isLimitReached ? (
        <div className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger flex items-center gap-2">
          <Info className="size-4 shrink-0" />
          <span>
            Free limit reached (3/3).{' '}
            <Link href="/pricing" className="underline font-bold hover:text-white">Upgrade plan</Link> for unlimited.
          </span>
        </div>
      ) : null}

      <form className="grid gap-3.5 sm:grid-cols-2" onSubmit={onSubmit}>
        <fieldset disabled={isUnapprovedInstitution || isLimitReached} className="contents">
          
          {/* Row 1: Student Name & Student ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Student Name <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              placeholder="e.g. Varsha Sharma" 
              value={values.studentName} 
              onChange={(e) => onChange('studentName', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Student ID <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              placeholder="e.g. 21-ICS-054" 
              value={values.studentId} 
              onChange={(e) => onChange('studentId', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Row 2: Student Email & Graduation Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Student Email <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              type="email" 
              placeholder="e.g. student@university.edu" 
              value={values.email} 
              onChange={(e) => onChange('email', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Graduation Year <span className="text-danger">*</span>
            </label>
            <Input 
              type="number" 
              placeholder="e.g. 2026" 
              value={values.graduationYear} 
              onChange={(e) => onChange('graduationYear', Number(e.target.value))} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Row 3: Degree & Course */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Degree <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              placeholder="e.g. Bachelor of Technology" 
              value={values.degree} 
              onChange={(e) => onChange('degree', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Course <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              placeholder="e.g. Computer Science & Engineering" 
              value={values.course} 
              onChange={(e) => onChange('course', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Row 4: Department & Grade / CGPA */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Department <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              placeholder="e.g. School of ICT" 
              value={values.department} 
              onChange={(e) => onChange('department', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Grade / CGPA <span className="text-[10px] font-normal text-foreground/50">(Optional)</span>
            </label>
            <Input 
              placeholder="e.g. 9.2 CGPA / First Class" 
              value={values.grade} 
              onChange={(e) => onChange('grade', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Row 5: Institution ID & Authorized Signatory */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Institution ID <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              placeholder="e.g. INST-GBU-01" 
              value={values.institutionId} 
              onChange={(e) => onChange('institutionId', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/90 block">
              Authorized Signatory <span className="text-[10px] font-normal text-foreground/50">(Optional)</span>
            </label>
            <Input 
              placeholder="e.g. Registrar / Dean of Academics" 
              value={values.approvedBy} 
              onChange={(e) => onChange('approvedBy', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Row 6: Institution Name (Full-width 2-column span) */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground/90 block">
              Institution Name <span className="text-danger">*</span>
            </label>
            <Input 
              required 
              placeholder="e.g. Gautam Buddha University" 
              value={values.institutionName} 
              onChange={(e) => onChange('institutionName', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-border/15 hover:border-border/30 focus:border-accent/80 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>

          {/* Row 6: Dates Row - Issue Date & Expiry Date (Side by side) */}
          <div className="space-y-1.5">
            <div className="h-6 flex items-center justify-between">
              <label className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Issue Date <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleSetToday}
                className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 px-2 py-0.5 rounded-md transition-colors"
                title="Set to today's date"
              >
                Set Today
              </button>
            </div>
            <Input 
              required 
              type="date" 
              value={values.issueDate} 
              onChange={(e) => onChange('issueDate', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-sky-500/30 hover:border-sky-500/50 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-colors [color-scheme:dark] text-foreground font-medium cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="h-6 flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Expiry Date <span className="text-[10px] font-normal text-foreground/50">(Optional)</span>
              </label>
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleSetLifetime}
                className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-2 py-0.5 rounded-md transition-colors"
                title="Permanent lifetime validity"
              >
                Lifetime
              </button>
            </div>
            <Input 
              type="date" 
              value={values.expiryDate} 
              onChange={(e) => onChange('expiryDate', e.target.value)} 
              className="h-9 text-xs rounded-xl bg-card/60 border-amber-500/30 hover:border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-colors [color-scheme:dark] text-foreground font-medium cursor-pointer"
            />
          </div>

          {/* 12. Compact Certificate PDF Upload (Spans 2 columns) */}
          <div className="space-y-1.5 sm:col-span-2 pt-1">
            <div className="h-6 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
                <FileText className="size-3.5 text-accent" />
                Certificate PDF Document <span className="text-danger">*</span>
              </label>
              <span className="text-[10px] text-foreground/50 font-mono">PDF | Max 10MB</span>
            </div>

            <input 
              ref={fileInputRef}
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange}
              className="hidden" 
            />

            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`cursor-pointer h-11 rounded-xl border border-dashed px-4 flex items-center justify-between transition-colors text-xs ${
                  isDragOver 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border/30 hover:border-accent bg-foreground/[0.02] hover:bg-accent/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 text-foreground/75">
                  <UploadCloud className="size-4 text-accent shrink-0" />
                  <span>Choose or drag PDF certificate to attach</span>
                </div>
                <Badge className="border-border/15 bg-card text-[10px] font-semibold text-foreground/70">
                  Browse PDF
                </Badge>
              </div>
            ) : (
              <div className="h-11 rounded-xl border border-success/30 bg-success/[0.06] px-3.5 flex items-center justify-between gap-2 text-xs transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="size-2 rounded-full bg-success shrink-0 animate-pulse" />
                  <span className="font-semibold text-foreground truncate">{file.name}</span>
                  <span className="text-[10px] text-foreground/50 shrink-0 font-mono">({formatFileSize(file.size)})</span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="rounded-lg size-7 p-0 text-foreground/50 hover:text-danger hover:bg-danger/10 shrink-0 transition-colors"
                  title="Remove file"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="sm:col-span-2 pt-2 border-t border-border/10 flex items-center justify-between">
            <span className="text-[11px] text-foreground/50 flex items-center gap-1.5 font-mono">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ethereum + IPFS (SHA-256 anchored)
            </span>
            <Button 
              type="submit" 
              disabled={loading || !file}
              className="rounded-xl h-9 px-5 text-xs font-bold shadow-glow hover:scale-105 active:scale-95 transition-all"
            >
              {loading ? <Sparkles className="size-3.5 animate-spin mr-1.5" /> : null}
              {loading ? 'Issuing...' : 'Issue Certificate'}
            </Button>
          </div>

        </fieldset>
      </form>
    </GlassCard>
  );
}
