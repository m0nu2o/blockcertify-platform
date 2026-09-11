import { MarketingShell } from '@/components/marketing-shell';
import { GlassCard } from '@/components/ui/glass-card';

const sections = [
  {
    title: 'Authentication model',
    description:
      'Auth.js handles the frontend session while every protected API request uses a server-issued Bearer token. There is no partial CSRF flow to maintain for the API write paths.',
  },
  {
    title: 'Certificate lifecycle',
    description:
      'Institutions upload PDFs, the server computes SHA-256 hashes, pins PDF + metadata to IPFS, writes issuance/update/revoke events on-chain, and stores tenant-aware records in MongoDB.',
  },
  {
    title: 'Public verification',
    description:
      'Verification by certificate ID, QR payload, transaction hash, or file hash is strictly read-only and compares MongoDB data against on-chain certificate state without broadcasting transactions.',
  },
  {
    title: 'Security controls',
    description:
      'Helmet, CORS, input validation with Zod, rate limiting, XSS safeguards, HPP, mongo-sanitize, role-based authorization, audit logging, and IDOR protection secure the platform end-to-end.',
  },
  {
    title: 'Operational docs',
    description:
      'Use the repository README and docs/api-overview.md for endpoint references, environment variables, deployment steps, and the contract redeploy checklist after ABI-affecting changes.',
  },
];

const endpointGroups = [
  {
    title: 'Authentication',
    endpoints: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/forgot-password', 'POST /api/auth/reset-password', 'GET /api/auth/me'],
  },
  {
    title: 'Certificates',
    endpoints: ['GET /api/certificates', 'GET /api/certificates/:id', 'POST /api/certificates', 'POST /api/certificates/bulk/upload', 'PATCH /api/certificates/:id/update', 'PATCH /api/certificates/:id/revoke', 'GET /api/certificates/exports/:type'],
  },
  {
    title: 'Verification',
    endpoints: ['POST /api/verification/id', 'POST /api/verification/hash', 'POST /api/verification/transaction', 'POST /api/verification/qr'],
  },
  {
    title: 'Analytics & operations',
    endpoints: ['GET /api/analytics/overview', 'GET /api/analytics/admin', 'GET /api/analytics/institution', 'GET /api/analytics/student', 'GET /api/admin/audit-logs', 'GET /api/admin/blockchain-transactions', 'GET /api/notifications', 'PATCH /api/notifications/:id/read'],
  },
];

export default function DocumentationPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-semibold tracking-tight">Documentation</h1>
          <p className="mt-4 max-w-3xl text-lg text-foreground/65">
            BlockCertify ships with a documented monorepo, environment templates, tests, and production-focused security controls. The summaries below align with the current backend routes and frontend auth model.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <GlassCard key={section.title}>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <p className="mt-3 text-sm leading-7 text-foreground/65">{section.description}</p>
              </GlassCard>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {endpointGroups.map((group) => (
              <GlassCard key={group.title}>
                <h2 className="text-xl font-semibold">{group.title}</h2>
                <div className="mt-4 grid gap-3 text-sm text-foreground/70">
                  {group.endpoints.map((endpoint) => (
                    <div key={endpoint} className="rounded-2xl border border-border/12 bg-foreground/[0.04] px-4 py-3 font-mono text-xs sm:text-sm text-foreground">
                      {endpoint}
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
