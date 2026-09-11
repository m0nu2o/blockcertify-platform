"use client";

import { useEffect, useState } from 'react';
import { MarketingShell } from '@/components/marketing-shell';
import { SectionTitle } from '@/components/section-title';
import { GlassCard } from '@/components/ui/glass-card';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

type LedgerEntry = {
  _id: string;
  certificateId: string;
  studentName: string;
  course: string;
  institutionName: string;
  issueDate: string;
  transactionHash: string;
};

export default function ExplorerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ success: boolean; data: LedgerEntry[] }>('/explorer/latest')
      .then((res) => {
        setEntries(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <MarketingShell>
      <section className="px-4 py-20 min-h-screen">
        <div className="mx-auto max-w-5xl">
          <SectionTitle 
            eyebrow="Public Ledger" 
            title="Real-time Network Activity" 
            description="A live feed of the most recently minted certificates secured on the blockchain." 
          />
          
          <div className="mt-12">
            <GlassCard className="p-6 md:p-8 rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 blur-3xl pointer-events-none">
                <div className="w-64 h-64 bg-accent rounded-full animate-pulse" />
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                </div>
                <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                  <Activity className="size-5 text-accent" />
                  Latest Minted Certificates
                </h3>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-foreground/[0.03] animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div 
                      key={entry._id} 
                      className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-foreground/[0.02] border border-border/10 hover:border-accent/30 hover:bg-foreground/[0.04] transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="size-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {entry.institutionName} 
                            <span className="text-foreground/40 font-normal text-sm">issued to</span> 
                            {entry.studentName}
                          </div>
                          <div className="text-sm text-foreground/60 mt-1">
                            {entry.course}
                          </div>
                          <div className="text-xs font-mono text-foreground/40 mt-2 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                            Tx: {entry.transactionHash}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                        <span className="text-xs font-medium text-foreground/50 bg-foreground/5 px-2.5 py-1 rounded-full">
                          {formatDate(entry.issueDate)}
                        </span>
                        <Link 
                          href={`/verify?id=${entry.certificateId}`}
                          className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                          Verify <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <div className="text-center py-12 text-foreground/50">
                      No certificates have been minted yet.
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
