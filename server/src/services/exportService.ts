
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import Certificate from '../models/Certificate.js';
import AuditLog from '../models/AuditLog.js';

export const exportCertificatesCsv = async (query: Record<string, unknown> = {}) => {
  const records = await Certificate.find(query).lean();
  if (records.length === 0) {
    return 'certificateId,studentName,studentId,degree,course,department,institutionName,issueDate,status\n';
  }
  const parser = new Parser();
  return parser.parse(records);
};

export const exportCertificatesExcel = async (query: Record<string, unknown> = {}) => {
  const records = await Certificate.find(query).lean();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Certificates');

  if (records.length > 0) {
    const headers = Object.keys(records[0]).filter((k) => k !== '_id' && k !== '__v');
    worksheet.columns = headers.map((header) => ({ header, key: header }));

    records.forEach((record) => {
      worksheet.addRow(record);
    });
  } else {
    worksheet.columns = [
      { header: 'certificateId', key: 'certificateId' },
      { header: 'studentName', key: 'studentName' },
      { header: 'degree', key: 'degree' },
      { header: 'status', key: 'status' },
    ];
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

export const exportCertificatesPdf = async (query: Record<string, unknown> = {}) => {
  const records = await Certificate.find(query).limit(100).lean();
  const doc = new PDFDocument({ margin: 30 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  doc.pipe(stream);
  doc.fontSize(20).text('BlockCertify Certificate Report', { underline: true });
  doc.moveDown();
  if (records.length === 0) {
    doc.fontSize(12).text('No certificates found matching your criteria.');
  } else {
    records.forEach((record) => {
      doc.fontSize(11).text(`${record.certificateId} • ${record.studentName} • ${record.degree} • ${record.status}`);
    });
  }
  doc.end();

  return await new Promise<Buffer>((resolve) => {
    stream.on('finish', () => resolve(Buffer.concat(chunks)));
  });
};

export const exportAuditLogsCsv = async (query: Record<string, unknown> = {}) => {
  const records = await AuditLog.find(query).lean();
  if (records.length === 0) {
    return 'createdAt,actorEmail,action,severity\n';
  }
  const parser = new Parser();
  return parser.parse(records);
};

export const exportAuditLogsPdf = async (query: Record<string, unknown> = {}) => {
  const records = await AuditLog.find(query).sort({ createdAt: -1 }).limit(100).lean();
  const doc = new PDFDocument({ margin: 30 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  doc.pipe(stream);
  doc.fontSize(20).text('BlockCertify Security Audit Report', { underline: true });
  doc.moveDown();
  if (records.length === 0) {
    doc.fontSize(12).text('No audit logs found matching your criteria.');
  } else {
    records.forEach((record) => {
      const dateStr = (record as unknown as { createdAt?: Date }).createdAt
        ? new Date((record as unknown as { createdAt: Date }).createdAt).toISOString()
        : '';
      doc.fontSize(10).text(`${dateStr} • ${record.actorEmail || 'system'} • ${record.action} • ${record.severity}`);
    });
  }
  doc.end();

  return await new Promise<Buffer>((resolve) => {
    stream.on('finish', () => resolve(Buffer.concat(chunks)));
  });
};

