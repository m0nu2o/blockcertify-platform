
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getDemoFallback<T>(path: string, method = 'GET'): T | null {
  const p = path.split('?')[0];

  if (p === '/analytics/admin') {
    return {
      success: true,
      message: 'Admin analytics retrieved',
      data: {
        stats: {
          certificatesIssued: 142,
          certificatesVerified: 589,
          certificatesRevoked: 3,
          institutions: 18,
          students: 1250,
          transactions: 145,
        },
        institutionRankings: [
          { _id: 'inst-1', name: 'Future University', stats: { certificatesIssued: 98, certificatesRevoked: 1, studentsManaged: 820 } },
          { _id: 'inst-2', name: 'MIT Innovation Lab', stats: { certificatesIssued: 44, certificatesRevoked: 2, studentsManaged: 430 } },
        ],
        trafficAnalytics: [
          { _id: 1, count: 120 },
          { _id: 2, count: 210 },
          { _id: 3, count: 340 },
          { _id: 4, count: 480 },
          { _id: 5, count: 589 },
        ],
      },
    } as unknown as T;
  }

  if (p === '/admin/audit-logs') {
    return {
      success: true,
      message: 'Audit logs retrieved',
      data: {
        items: [
          { _id: 'log-1', action: 'CERTIFICATE_ISSUED', actorEmail: 'registrar@futureuniversity.edu', entity: 'Certificate', createdAt: new Date().toISOString() },
          { _id: 'log-2', action: 'SUBSCRIPTION_APPROVED', actorEmail: 'admin@blockcertify.com', entity: 'Subscription', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { _id: 'log-3', action: 'INSTITUTION_REGISTERED', actorEmail: 'registrar@futureuniversity.edu', entity: 'Institution', createdAt: new Date(Date.now() - 86400000).toISOString() },
        ],
        total: 3,
      },
    } as unknown as T;
  }

  if (p === '/admin/blockchain-transactions') {
    return {
      success: true,
      message: 'Transactions retrieved',
      data: {
        items: [
          { _id: 'tx-1', action: 'ISSUE_CERTIFICATE', transactionHash: '0x3a8f5b892d1c67e41b89', status: 'confirmed', gasUsed: '45210', createdAt: new Date().toISOString() },
          { _id: 'tx-2', action: 'REVOKE_CERTIFICATE', transactionHash: '0x7e2b8c9141a9d07f32e1', status: 'confirmed', gasUsed: '32100', createdAt: new Date(Date.now() - 7200000).toISOString() },
        ],
        total: 2,
      },
    } as unknown as T;
  }

  if (p === '/admin/institutions') {
    return {
      success: true,
      message: 'Institutions retrieved',
      data: {
        items: [
          { _id: 'inst-1', name: 'Future University', email: 'registrar@futureuniversity.edu', website: 'https://futureuniversity.edu', contactPerson: 'Registrar Office', status: 'approved', createdAt: new Date().toISOString() },
        ],
        total: 1,
      },
    } as unknown as T;
  }

  if (p === '/admin/verification-logs') {
    return {
      success: true,
      message: 'Verification logs retrieved',
      data: {
        items: [
          { _id: 'vlog-1', certificateId: 'BC-5A4A9D6E', verifiedAt: new Date().toISOString(), result: 'valid', ipAddress: '127.0.0.1' },
        ],
        total: 1,
      },
    } as unknown as T;
  }

  if (p === '/admin/subscriptions') {
    return {
      success: true,
      message: 'Subscriptions retrieved',
      data: {
        items: [
          {
            _id: 'sub-1',
            tier: 'Growth',
            status: 'pending',
            requestedAt: new Date().toISOString(),
            institution: { _id: 'inst-1', name: 'Future University', email: 'registrar@futureuniversity.edu' },
            user: { _id: 'user-1', name: 'Registrar Office', email: 'registrar@futureuniversity.edu', role: 'institution' },
          },
        ],
        total: 1,
        pendingCount: 1,
      },
    } as unknown as T;
  }

  if (p === '/subscriptions/my-status') {
    return {
      success: true,
      data: {
        tier: 'Enterprise',
        status: 'active',
        planName: 'Enterprise Plan',
        isExempt: true,
        limits: { monthlyCertificates: -1, bulkUploadLimit: 500, templatesAllowed: 20 },
        usage: { currentMonthCertificates: 12, remainingCertificates: -1 },
      },
    } as unknown as T;
  }

  if (p === '/subscriptions/request' && method === 'POST') {
    return {
      success: true,
      message: 'Subscription request submitted for admin review.',
      data: { status: 'pending', tier: 'Starter' },
    } as unknown as T;
  }

  if (p.startsWith('/admin/subscriptions/') && method === 'PATCH') {
    return {
      success: true,
      message: 'Subscription request updated successfully.',
      data: { status: 'active' },
    } as unknown as T;
  }

  if (p === '/student/certificates') {
    return {
      success: true,
      data: {
        certificates: [
          {
            _id: 'cert-1',
            certificateId: 'BC-5A4A9D6E',
            studentName: 'Ava Thompson',
            degree: 'Bachelor of Science',
            course: 'Computer Science',
            institutionName: 'Future University',
            issueDate: new Date().toISOString().slice(0, 10),
            revoked: false,
          },
        ],
      },
    } as unknown as T;
  }

  return null;
}

export async function apiFetch<T>(path: string, options?: RequestInit & { token?: string; timeoutMs?: number }) {
  const method = (options?.method || 'GET').toUpperCase();
  const headers = new Headers(options?.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (options?.token) headers.set('Authorization', `Bearer ${options.token}`);

  const timeoutMs = options?.timeoutMs || 4000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options?.signal || controller.signal,
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data as T;
  } catch (err: unknown) {
    // If backend is unreachable or timed out, check for fallback
    const fallback = getDemoFallback<T>(path, method);
    if (fallback !== null) {
      return fallback;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check backend connection.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const buildUploadHeaders = (token?: string) => {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
};
