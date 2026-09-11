import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, Copy, Check, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { buildUploadHeaders } from '@/lib/api';
import { getSubscriptionTier, SubscriptionTier } from '@/lib/subscription';
import { cn } from '@/lib/utils';

type BulkRow = { studentId: string; studentName: string };

type BulkResult = {
  succeeded: Array<{ row: BulkRow; success: true; certificateId: string }>;
  failed: Array<{ row: BulkRow; success: false; error: string }>;
};

const CSV_TEMPLATE_HEADER = 'studentName,studentId,email,degree,course,department,graduationYear,issueDate,expiryDate';

export function BulkCertificateUploadForm({
  accessToken,
  institutions,
  onCompleted,
  disabled = false,
}: {
  accessToken?: string;
  institutions?: Array<{ _id: string; name: string }>;
  onCompleted?: () => void;
  disabled?: boolean;
}) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [institutionId, setInstitutionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [copied, setCopied] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    if (userId) {
      setTier(getSubscriptionTier(userId));
    }
  }, [userId]);

  const isFree = tier === 'free';
  const needsInstitutionPicker = Boolean(institutions);

  const handleCopyHeader = () => {
    navigator.clipboard.writeText(CSV_TEMPLATE_HEADER);
    setCopied(true);
    toast.success('CSV header copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSampleCsv = () => {
    const sampleCsv = `${CSV_TEMPLATE_HEADER}\n"Varsha Sharma","21-ICS-054","student@university.edu","Bachelor of Technology","Computer Science & Engineering","School of ICT",2026,"2026-08-30",""`;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_certificates_upload.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV downloaded!');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: disabled || isFree
  });

  const onSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!file || !accessToken) {
      toast.error('Please attach a CSV file and ensure you are signed in.');
      return;
    }
    if (needsInstitutionPicker && !institutionId) {
      toast.error('Please select an institution.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (needsInstitutionPicker) formData.append('institutionId', institutionId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/certificates/bulk/upload`, {
        method: 'POST',
        headers: buildUploadHeaders(accessToken),
        body: formData,
      });
      const data = (await response.json()) as { data?: BulkResult; message?: string };
      if (!response.ok || !data.data) throw new Error(data.message || 'Bulk upload failed');

      setResult(data.data);
      toast.success(`Processed ${data.data.succeeded.length + data.data.failed.length} rows`);
      setFile(null);
      onCompleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-5 md:p-6 rounded-2xl border-border/12 shadow-glass overflow-hidden">
      <div className="mb-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Bulk Issue Certificates</h3>
          <p className="mt-0.5 text-xs text-foreground/65">
            Batch-issue blockchain certificates by uploading a spreadsheet of student records.
          </p>
        </div>

        {/* Formatted CSV Requirement Box (Wraps cleanly without overflow) */}
        <div className="rounded-xl border border-border/15 bg-card/60 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-foreground">
            <div className="flex items-center gap-1.5 text-sky-400">
              <FileSpreadsheet className="size-4" />
              <span>Required CSV Header Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleCopyHeader}
                className="text-[11px] font-semibold text-accent hover:text-accent/80 bg-accent/10 hover:bg-accent/20 border border-accent/25 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5"
              >
                {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                {copied ? 'Copied' : 'Copy Header'}
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleDownloadSampleCsv}
                className="text-[11px] font-semibold text-foreground/80 hover:text-foreground bg-foreground/[0.05] hover:bg-foreground/[0.08] border border-border/20 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5"
              >
                <Download className="size-3 text-accent" />
                Sample CSV
              </button>
            </div>
          </div>

          {/* Clean wrapping column pills */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              { name: 'studentName', req: true },
              { name: 'studentId', req: true },
              { name: 'email', req: true },
              { name: 'degree', req: true },
              { name: 'course', req: true },
              { name: 'department', req: true },
              { name: 'graduationYear', req: true },
              { name: 'issueDate', req: true },
              { name: 'expiryDate', req: false },
            ].map((col) => (
              <span
                key={col.name}
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                  col.req 
                    ? 'border-accent/25 bg-accent/10 text-accent font-medium' 
                    : 'border-border/15 bg-foreground/[0.03] text-foreground/55'
                }`}
              >
                {col.name}{col.req ? '*' : ' (opt)'}
              </span>
            ))}
          </div>

          <div className="text-[11px] text-foreground/55 font-mono break-all pt-1 border-t border-border/10">
            <span className="text-foreground/40 select-none">Preview: </span>
            <span className="text-foreground/80">{CSV_TEMPLATE_HEADER}</span>
          </div>
        </div>
      </div>
      
      {isFree && (
        <div className="mb-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent font-medium">
          Bulk uploads are only available to premium subscribers. Please{' '}
          <Link href="/pricing" className="underline font-bold hover:text-foreground transition">
            upgrade your plan
          </Link>{' '}
          to unlock bulk issuance.
        </div>
      )}
      
      {disabled && !isFree && (
        <div className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning font-medium">
          Your institution is pending admin approval. Bulk issuance is disabled until an administrator approves your account.
        </div>
      )}
      
      <form className="grid gap-5" onSubmit={onSubmit}>
        <fieldset disabled={disabled || isFree} className="contents">
          {needsInstitutionPicker && (
            <select
              className="h-14 rounded-2xl border border-border/15 bg-card/60 text-foreground px-4 text-sm outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              value={institutionId}
              onChange={(event) => setInstitutionId(event.target.value)}
              aria-label="Select institution"
            >
              <option value="" className="bg-card text-foreground">Select an institution...</option>
              {institutions?.map((institution) => (
                <option key={institution._id} value={institution._id} className="bg-card text-foreground">
                  {institution.name}
                </option>
              ))}
            </select>
          )}

          {!file ? (
            <div 
              {...getRootProps()} 
              className={cn(
                "relative overflow-hidden flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-10 transition-all duration-300 cursor-pointer min-h-[220px]",
                isDragActive 
                  ? "border-accent bg-accent/10 scale-[1.02] shadow-glow" 
                  : "border-border/20 bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-accent/40"
              )}
            >
              <input {...getInputProps()} />
              <div className={cn("grid place-items-center size-16 rounded-full mb-4 transition-colors", isDragActive ? "bg-accent text-white" : "bg-foreground/10 text-foreground/50")}>
                <UploadCloud className="size-8" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">
                  {isDragActive ? "Drop the CSV here..." : "Click or drag your CSV file here"}
                </p>
                <p className="mt-2 text-sm text-foreground/50 max-w-[250px] mx-auto">
                  Only .csv files are supported. Maximum size is 5MB.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-[2rem] border border-accent/30 bg-accent/5 p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="grid place-items-center size-12 rounded-full bg-accent/20 text-accent">
                  <FileText className="size-6" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{file.name}</div>
                  <div className="text-xs text-foreground/60">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button 
                type="button"
                suppressHydrationWarning
                onClick={() => setFile(null)}
                className="rounded-full p-2 text-foreground/50 hover:bg-foreground/10 hover:text-foreground transition-colors"
                aria-label="Remove file"
              >
                <X className="size-5" />
              </button>
            </div>
          )}

          <Button disabled={loading || !file} size="lg" className="h-14 rounded-2xl w-full text-base shadow-glow">
            {loading ? 'Processing Upload...' : 'Issue Certificates'}
          </Button>
        </fieldset>
      </form>

      {result && (
        <div className="mt-6 grid gap-4 text-sm">
          <div className="flex gap-4 p-4 rounded-[1.5rem] bg-card border border-border/10 items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-success">{result.succeeded.length}</span>
              <span className="text-foreground/60 uppercase tracking-widest text-[10px] font-bold mt-1">Succeeded</span>
            </div>
            <div className="h-10 w-px bg-border/20 mx-4" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-danger">{result.failed.length}</span>
              <span className="text-foreground/60 uppercase tracking-widest text-[10px] font-bold mt-1">Failed</span>
            </div>
          </div>

          {result.succeeded.length > 0 && (
            <div className="rounded-[1.5rem] border border-success/20 bg-success/5 p-5">
              <div className="mb-3 font-bold text-success">Successful Records</div>
              <ul className="grid gap-2 text-foreground/70">
                {result.succeeded.map((item) => (
                  <li key={item.certificateId} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-success shrink-0" />
                    <span className="font-medium text-foreground">{item.row.studentId}</span> 
                    <span className="opacity-60">({item.row.studentName})</span> 
                    <span className="opacity-40">&rarr;</span> 
                    <span className="font-mono text-xs opacity-75">{item.certificateId}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.failed.length > 0 && (
            <div className="rounded-[1.5rem] border border-danger/20 bg-danger/5 p-5">
              <div className="mb-3 font-bold text-danger">Failed Records</div>
              <ul className="grid gap-2 text-foreground/70">
                {result.failed.map((item, index) => (
                  <li key={`${item.row.studentId}-${index}`} className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-danger shrink-0 mt-1.5" />
                    <div>
                      <span className="font-medium text-foreground">{item.row.studentId}</span> 
                      <span className="opacity-60 mx-1">({item.row.studentName}):</span> 
                      <span className="text-danger opacity-90">{item.error}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
