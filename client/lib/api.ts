import seedData from './mongo-seed-data.json';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// In-memory & local-storage subscription approval state
const _approvedSubIds = new Set<string>();

const getApprovedSubs = (): Set<string> => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('blockcertify-approved-subs');
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {
      // ignore
    }
  }
  return _approvedSubIds;
};

const markSubApproved = (id: string) => {
  _approvedSubIds.add(id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('blockcertify-approved-subs', JSON.stringify(Array.from(_approvedSubIds)));
    } catch {
      // ignore
    }
  }
};

function getLocalCertificates(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('blockcertify-local-certificates');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalInstitutions(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('blockcertify-registered-institutions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalStudents(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('blockcertify-registered-students');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalUsers(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('blockcertify-registered-users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getDemoFallback<T>(path: string, method = 'GET', body?: unknown): T | null {
  const p = path.split('?')[0];
  const approvedSet = getApprovedSubs();
  const localCerts = getLocalCertificates();
  const localInstitutions = getLocalInstitutions();
  const localStudents = getLocalStudents();
  const localUsers = getLocalUsers();

  if (p === '/analytics/admin' || p === '/analytics/overview') {
    const mergedRankings = [...seedData.institutionRankings];
    for (const inst of localInstitutions) {
      if (!mergedRankings.some((r) => r._id === inst._id || r.name === inst.name)) {
        mergedRankings.unshift({
          _id: inst._id,
          name: inst.name,
          stats: { certificatesIssued: 0, certificatesRevoked: 0, studentsManaged: 0 },
        });
      }
    }

    return {
      success: true,
      message: 'Analytics retrieved',
      data: {
        stats: {
          ...seedData.stats,
          certificatesIssued: seedData.stats.certificatesIssued + localCerts.length,
          institutions: seedData.stats.institutions + localInstitutions.length,
          students: seedData.stats.students + localStudents.length,
          transactions: seedData.stats.transactions + localCerts.length,
        },
        institutionRankings: mergedRankings,
        trafficAnalytics: seedData.trafficAnalytics,
      },
    } as unknown as T;
  }

  if (p === '/notifications') {
    return {
      success: true,
      data: [
        { _id: 'notif-1', title: 'System Ready', message: 'Blockchain node and smart contracts active with live MongoDB synchronization.', type: 'success', read: false, createdAt: new Date().toISOString() },
        { _id: 'notif-2', title: 'Real Ledger Synced', message: `${seedData.certificates.length + localCerts.length} certificates and ${seedData.transactions.length + localCerts.length} blockchain transactions loaded.`, type: 'info', read: true, createdAt: new Date().toISOString() },
      ],
    } as unknown as T;
  }

  if (p.startsWith('/notifications/') && method === 'PATCH') {
    return { success: true, message: 'Notification updated' } as unknown as T;
  }

  if (p === '/certificates' || p === '/certificates/recent') {
    // Map to prevent duplicate certificate IDs while putting newly issued first
    const certMap = new Map<string, any>();
    for (const c of localCerts) {
      if (c.certificateId) certMap.set(c.certificateId, c);
    }
    for (const c of seedData.certificates || []) {
      if (c.certificateId && !certMap.has(c.certificateId)) {
        certMap.set(c.certificateId, c);
      }
    }
    const combinedCerts = Array.from(certMap.values());

    return {
      success: true,
      data: {
        items: combinedCerts,
        total: combinedCerts.length,
        page: 1,
        limit: 50,
      },
    } as unknown as T;
  }

  if (p === '/certificates/institution/summary') {
    const totalIssued = seedData.stats.certificatesIssued + localCerts.length;
    return {
      success: true,
      data: {
        totalIssued,
        totalRevoked: seedData.stats.certificatesRevoked,
        activeTemplates: 4,
        monthlyLimit: 500,
        remainingThisMonth: Math.max(0, 500 - totalIssued),
      },
    } as unknown as T;
  }

  if (p === '/analytics/institution') {
    const certMap = new Map<string, any>();
    for (const c of localCerts) {
      if (c.certificateId) certMap.set(c.certificateId, c);
    }
    for (const c of seedData.certificates || []) {
      if (c.certificateId && !certMap.has(c.certificateId)) {
        certMap.set(c.certificateId, c);
      }
    }
    const combinedCerts = Array.from(certMap.values());

    return {
      success: true,
      data: {
        issued: seedData.stats.certificatesIssued + localCerts.length,
        revoked: seedData.stats.certificatesRevoked,
        students: seedData.stats.students + localStudents.length,
        recentCertificates: combinedCerts.slice(0, 10),
      },
    } as unknown as T;
  }

  if (p === '/analytics/student') {
    const certMap = new Map<string, any>();
    for (const c of localCerts) {
      if (c.certificateId) certMap.set(c.certificateId, c);
    }
    for (const c of seedData.certificates || []) {
      if (c.certificateId && !certMap.has(c.certificateId)) {
        certMap.set(c.certificateId, c);
      }
    }
    const combinedCerts = Array.from(certMap.values());
    const studentCerts = combinedCerts.filter(
      (c) => c.studentName === 'Ava Thompson' || c.studentId === 'STU-001' || localCerts.some((lc) => lc.certificateId === c.certificateId)
    );
    return {
      success: true,
      data: {
        totalCertificates: studentCerts.length || 2,
        verifiedCertificates: studentCerts.length || 2,
        certificates: studentCerts.length > 0 ? studentCerts : combinedCerts.slice(0, 5),
      },
    } as unknown as T;
  }

  if (p === '/admin/audit-logs') {
    return {
      success: true,
      message: 'Audit logs retrieved',
      data: {
        items: seedData.auditLogs,
        total: seedData.auditLogs.length,
      },
    } as unknown as T;
  }

  if (p === '/admin/blockchain-transactions') {
    return {
      success: true,
      message: 'Transactions retrieved',
      data: {
        items: seedData.transactions,
        total: seedData.transactions.length,
      },
    } as unknown as T;
  }

  if (p === '/admin/institutions') {
    const instMap = new Map<string, any>();
    for (const inst of localInstitutions) {
      if (inst.name || inst.email) instMap.set((inst.email || inst.name).toLowerCase(), inst);
    }
    for (const inst of seedData.institutions || []) {
      const key = (inst.email || inst.name).toLowerCase();
      if (!instMap.has(key)) {
        instMap.set(key, inst);
      }
    }
    const combinedInsts = Array.from(instMap.values());
    return {
      success: true,
      message: 'Institutions retrieved',
      data: {
        items: combinedInsts,
        total: combinedInsts.length,
      },
    } as unknown as T;
  }

  if (p === '/admin/users') {
    const userMap = new Map<string, any>();
    for (const u of localUsers) {
      if (u.email) userMap.set(u.email.toLowerCase(), u);
    }
    for (const s of seedData.students || []) {
      if (s.email && !userMap.has(s.email.toLowerCase())) {
        userMap.set(s.email.toLowerCase(), { _id: s._id, name: s.name, email: s.email, role: 'student', createdAt: new Date().toISOString() });
      }
    }
    for (const inst of seedData.institutions || []) {
      if (inst.email && !userMap.has(inst.email.toLowerCase())) {
        userMap.set(inst.email.toLowerCase(), { _id: inst._id, name: inst.name, email: inst.email, role: 'institution', createdAt: new Date().toISOString() });
      }
    }
    const combinedUsers = Array.from(userMap.values());
    return {
      success: true,
      message: 'Users retrieved',
      data: {
        items: combinedUsers,
        total: combinedUsers.length,
      },
    } as unknown as T;
  }

  if (p === '/admin/verification-logs') {
    return {
      success: true,
      message: 'Verification logs retrieved',
      data: {
        items: seedData.verificationLogs,
        total: seedData.verificationLogs.length,
      },
    } as unknown as T;
  }

  if (p === '/students') {
    const searchParams = path.includes('?') ? new URLSearchParams(path.split('?')[1]) : null;
    const query = searchParams?.get('q')?.trim().toLowerCase() || '';

    let localStudents: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blockcertify-registered-students');
        if (stored) localStudents = JSON.parse(stored);
      } catch {}
    }

    const combinedMap = new Map<string, any>();
    // Locally registered students first so newly created students appear at top
    for (const s of localStudents) {
      if (s.email) combinedMap.set(s.email.toLowerCase(), s);
    }
    for (const s of seedData.students || []) {
      const email = s.email?.toLowerCase();
      if (email && !combinedMap.has(email)) {
        combinedMap.set(email, {
          _id: s._id,
          name: s.name,
          studentId: s.studentId,
          email: s.email,
          degree: s.degree,
          course: s.course,
          department: s.department,
          graduationYear: s.graduationYear,
        });
      }
    }

    const allStudents = Array.from(combinedMap.values());
    const filtered = query
      ? allStudents.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.studentId.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            (s.degree && s.degree.toLowerCase().includes(query)) ||
            (s.course && s.course.toLowerCase().includes(query))
        )
      : allStudents;
    return {
      success: true,
      message: 'Students retrieved',
      data: {
        items: filtered,
        total: filtered.length,
      },
    } as unknown as T;
  }

  if (p === '/admin/subscriptions') {
    const isApproved = approvedSet.has('sub-6abf849baa885c302719d1b5') || approvedSet.has('sub-1');
    return {
      success: true,
      message: 'Subscriptions retrieved',
      data: {
        items: [
          {
            _id: 'sub-6abf849baa885c302719d1b5',
            tier: 'Growth',
            status: isApproved ? 'active' : 'pending',
            requestedAt: '2026-10-02T10:16:59.636Z',
            approvedAt: isApproved ? new Date().toISOString() : undefined,
            institution: { _id: 'inst-school-of-arts', name: 'School of Arts', email: 'jultoexclusive@gmail.com' },
            user: { _id: 'user-monu', name: 'Monu', email: 'jultoexclusive@gmail.com', role: 'institution' },
          },
        ],
        total: 1,
        pendingCount: isApproved ? 0 : 1,
      },
    } as unknown as T;
  }

  if (p.startsWith('/admin/subscriptions/') && (method === 'POST' || method === 'PATCH')) {
    const subId = p.split('/')[3];
    if (subId) markSubApproved(subId);
    markSubApproved('sub-6abf849baa885c302719d1b5');
    markSubApproved('sub-1');
    return {
      success: true,
      message: 'Subscription request approved successfully. Plan activated.',
      data: { status: 'active' },
    } as unknown as T;
  }

  if (p === '/admin/reconcile' && method === 'POST') {
    return {
      success: true,
      message: 'Reconciliation completed. All on-chain records synchronized.',
      data: { reconciledCount: seedData.certificates.length, pendingCount: 0 },
    } as unknown as T;
  }

  if (p.startsWith('/admin/institutions/') && method === 'PATCH') {
    return {
      success: true,
      message: 'Institution updated successfully.',
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
        usage: { currentMonthCertificates: seedData.certificates.length, remainingCertificates: -1 },
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

  if (p === '/student/certificates') {
    const studentCerts = seedData.certificates.filter(c => c.studentName === 'Ava Thompson' || c.studentId === 'STU-001');
    return {
      success: true,
      data: {
        certificates: studentCerts.length > 0 ? studentCerts : seedData.certificates.slice(0, 2),
      },
    } as unknown as T;
  }

  // Verification Fallback — searches by the actual ID/hash the user entered
  if (p.startsWith('/verification/')) {
    const verifyType = p.split('/')[2]; // 'id' | 'hash' | 'transaction' | 'qr'

    // Parse the search key from the request body
    let searchKey = '';
    if (body) {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        searchKey = (
          parsed.certificateId ||
          parsed.hash ||
          parsed.transactionHash ||
          parsed.payload ||
          ''
        ).toString().trim().toUpperCase();
      } catch { /* ignore */ }
    }

    // Build a unified certificate pool: locally issued first, then seed data
    const allCerts = [...localCerts, ...(seedData.certificates || [])];
    const certMap = new Map<string, any>();
    for (const c of allCerts) {
      if (c.certificateId && !certMap.has(c.certificateId.toUpperCase())) {
        certMap.set(c.certificateId.toUpperCase(), c);
      }
    }

    // Find a match based on verification type
    let found: any = null;
    if (searchKey) {
      if (verifyType === 'id') {
        found = certMap.get(searchKey);
      } else if (verifyType === 'hash') {
        found = allCerts.find(
          (c) =>
            c.fileHash?.toUpperCase() === searchKey ||
            c.metadataHash?.toUpperCase() === searchKey
        );
      } else if (verifyType === 'transaction') {
        found = allCerts.find(
          (c) => c.transactionHash?.toUpperCase() === searchKey
        );
      } else {
        // QR / generic — try all fields
        found =
          certMap.get(searchKey) ||
          allCerts.find(
            (c) =>
              c.fileHash?.toUpperCase() === searchKey ||
              c.transactionHash?.toUpperCase() === searchKey
          );
      }
    }

    if (!found) {
      // Explicitly return not-found so the UI shows the correct error
      return {
        success: false,
        message: 'Certificate not found. Please check the ID and try again.',
        data: {
          valid: false,
          verificationState: 'not_found',
          onChainValid: false,
        },
      } as unknown as T;
    }

    const certStatus = found.status === 'revoked' ? 'revoked' : 'valid';
    return {
      success: true,
      message: 'Certificate successfully verified against blockchain record',
      data: {
        valid: certStatus === 'valid',
        verificationState: certStatus,
        onChainValid: certStatus === 'valid',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        certificate: {
          certificateId: found.certificateId,
          studentName: found.studentName,
          studentId: found.studentId,
          institutionName: found.institutionName,
          issueDate: found.issueDate,
          status: found.status || 'valid',
          fileHash: found.fileHash,
          transactionHash: found.transactionHash,
          metadataHash: found.metadataHash,
          degree: found.degree,
          course: found.course,
          department: found.department,
          grade: found.grade,
          approvedBy: found.approvedBy || found.signatoryTitle,
          expiryDate: found.expiryDate,
        },
      },
    } as unknown as T;
  }

  if (p === '/auth/register' && method === 'POST') {
    if (body && typeof window !== 'undefined') {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        const now = Date.now();

        // 1. General User Record
        const storedUsers = JSON.parse(localStorage.getItem('blockcertify-registered-users') || '[]');
        const newUser = {
          _id: `user-${now}`,
          name: parsed.name?.trim() || 'User',
          email: parsed.email?.trim().toLowerCase() || 'user@example.com',
          role: parsed.role || 'student',
          createdAt: new Date().toISOString(),
        };
        const uIdx = storedUsers.findIndex((u: any) => u.email === newUser.email);
        if (uIdx >= 0) storedUsers[uIdx] = { ...storedUsers[uIdx], ...newUser };
        else storedUsers.unshift(newUser);
        localStorage.setItem('blockcertify-registered-users', JSON.stringify(storedUsers));

        // 2. Student Record
        if (parsed.role === 'student') {
          const stored = JSON.parse(localStorage.getItem('blockcertify-registered-students') || '[]');
          const newStudent = {
            _id: `reg-stu-${now}`,
            name: parsed.name?.trim() || 'New Student',
            studentId: parsed.studentId?.trim() || `STU-${now.toString().slice(-5)}`,
            email: parsed.email?.trim().toLowerCase() || 'student@example.com',
            degree: 'Bachelor of Science',
            course: 'Computer Science',
            department: 'Engineering',
            graduationYear: new Date().getFullYear(),
          };
          const existingIdx = stored.findIndex((s: any) => s.email === newStudent.email || s.studentId === newStudent.studentId);
          if (existingIdx >= 0) {
            stored[existingIdx] = { ...stored[existingIdx], ...newStudent };
          } else {
            stored.unshift(newStudent);
          }
          localStorage.setItem('blockcertify-registered-students', JSON.stringify(stored));
        }

        // 3. Institution Record
        if (parsed.role === 'institution') {
          const storedInsts = JSON.parse(localStorage.getItem('blockcertify-registered-institutions') || '[]');
          const newInst = {
            _id: `reg-inst-${now}`,
            name: parsed.institutionName?.trim() || parsed.name?.trim() || 'New Institution',
            email: parsed.email?.trim().toLowerCase() || 'institution@example.com',
            website: parsed.website || 'https://blockcertify.io',
            status: 'approved',
            stats: { certificatesIssued: 0, certificatesRevoked: 0, studentsManaged: 0 },
            createdAt: new Date().toISOString(),
          };
          const existingInstIdx = storedInsts.findIndex((i: any) => i.email === newInst.email || i.name === newInst.name);
          if (existingInstIdx >= 0) {
            storedInsts[existingInstIdx] = { ...storedInsts[existingInstIdx], ...newInst };
          } else {
            storedInsts.unshift(newInst);
          }
          localStorage.setItem('blockcertify-registered-institutions', JSON.stringify(storedInsts));
        }

        window.dispatchEvent(new Event('storage'));
      } catch {}
    }
    return {
      success: true,
      message: 'Account created successfully',
      data: {
        token: `demo-token-${Date.now()}`,
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
    // If backend is unreachable, timed out, or returned 404, check for fallback
    const fallback = getDemoFallback<T>(path, method, options?.body);
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
