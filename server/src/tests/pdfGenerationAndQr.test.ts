import { describe, expect, it } from '@jest/globals';
import { createCertificatePdfBuffer } from '../services/certificateService.js';

describe('PDF Generation with Embedded Scannable QR Code', () => {
  it('generates a valid PDF buffer containing embedded QR image and structural objects', async () => {
    const certId = 'BC-TEST-QR-99';
    const verificationUrl = `https://blockcertify.com/verify?id=${certId}`;

    const pdfBuffer = await createCertificatePdfBuffer({
      certificateId: certId,
      studentName: 'Alice Smith',
      studentId: 'STU-2026-001',
      degree: 'Master of Science',
      course: 'Cybersecurity & Blockchain',
      department: 'Computer Science',
      institutionName: 'Stanford Engineering Academy',
      issueDate: '2026-09-24',
      expiryDate: '2030-09-24',
      verificationUrl,
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(4000);

    // 1. PDF Magic Header
    const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
    expect(pdfHeader).toBe('%PDF-');

    // 2. PDFKit embeds images as /Subtype /Image
    const rawPdf = pdfBuffer.toString('latin1');
    expect(rawPdf).toContain('/Subtype /Image');
    expect(rawPdf).toContain('/Type /XObject');
    expect(rawPdf).toContain('/Width 200');
    expect(rawPdf).toContain('/Height 200');
    expect(rawPdf).toContain('/ColorSpace /DeviceRGB');

    // 3. Document Structure
    expect(rawPdf).toContain('/Type /Catalog');
    expect(rawPdf).toContain('/Type /Pages');
    expect(rawPdf).toContain('trailer');
    expect(rawPdf).toContain('%%EOF');
  });

  it('generates a valid PDF when optional fields like department and expiryDate are omitted', async () => {
    const certId = 'BC-TEST-MINIMAL';

    const pdfBuffer = await createCertificatePdfBuffer({
      certificateId: certId,
      studentName: 'Bob Jones',
      studentId: 'STU-MIN-002',
      degree: 'Bachelor of Arts',
      course: 'Digital Media',
      institutionName: 'Global Design Institute',
      issueDate: '2026-09-24',
    });

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(4000);

    const rawPdf = pdfBuffer.toString('latin1');
    expect(rawPdf).toContain('%PDF-');
    expect(rawPdf).toContain('/Subtype /Image');
    expect(rawPdf).toContain('/Type /XObject');
    expect(rawPdf).toContain('%%EOF');
  });
});
