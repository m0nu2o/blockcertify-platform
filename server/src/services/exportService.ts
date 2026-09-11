
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import Certificate from '../models/Certificate.js';

export const exportCertificatesCsv = async () => {
  const records = await Certificate.find().lean();
  const parser = new Parser();
  return parser.parse(records);
};

export const exportCertificatesExcel = async () => {
  const records = await Certificate.find().lean();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Certificates');
  
  if (records.length > 0) {
    // Generate headers from the first record keys
    const headers = Object.keys(records[0]).filter(k => k !== '_id' && k !== '__v');
    worksheet.columns = headers.map(header => ({ header, key: header }));
    
    // Add rows
    records.forEach(record => {
      worksheet.addRow(record);
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

export const exportCertificatesPdf = async () => {
  const records = await Certificate.find().limit(50).lean();
  const doc = new PDFDocument({ margin: 30 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  doc.pipe(stream);
  doc.fontSize(20).text('BlockCertify Certificate Report', { underline: true });
  doc.moveDown();
  records.forEach((record) => {
    doc.fontSize(11).text(`${record.certificateId} • ${record.studentName} • ${record.degree} • ${record.status}`);
  });
  doc.end();

  return await new Promise<Buffer>((resolve) => {
    stream.on('finish', () => resolve(Buffer.concat(chunks)));
  });
};

export const exportAuditLogsCsv = async () => {
  const records = await AuditLog.find().lean();
  const parser = new Parser();
  return parser.parse(records);
};

export const exportAuditLogsPdf = async () => {
  const records = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
  const doc = new PDFDocument({ margin: 30 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  doc.pipe(stream);
  doc.fontSize(20).text('BlockCertify Security Audit Report', { underline: true });
  doc.moveDown();
  records.forEach((record) => {
    const dateStr = (record as any).createdAt ? new Date((record as any).createdAt).toISOString() : '';
    doc.fontSize(10).text(`${dateStr} • ${record.actorEmail || 'system'} • ${record.action} • ${record.severity}`);
  });
  doc.end();

  return await new Promise<Buffer>((resolve) => {
    stream.on('finish', () => resolve(Buffer.concat(chunks)));
  });
};

import AuditLog from '../models/AuditLog.js';
