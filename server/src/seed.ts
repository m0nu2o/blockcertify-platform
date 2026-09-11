
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Institution from './models/Institution.js';
import Student from './models/Student.js';
import Certificate from './models/Certificate.js';
import Setting from './models/Setting.js';
import { issueCertificate } from './services/certificateService.js';

const buildSampleCertificatePdf = async () => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  doc.pipe(stream);
  doc.fontSize(26).text('BlockCertify Official Certificate', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text('This certifies that Ava Thompson', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text('Student ID: STU-001', { align: 'center' });
  doc.text('Degree: Bachelor of Science', { align: 'center' });
  doc.text('Course: Computer Science', { align: 'center' });
  doc.text('Issued by: Future University', { align: 'center' });
  doc.text(`Issue date: ${new Date().toISOString().slice(0, 10)}`, { align: 'center' });
  doc.end();
  return await new Promise<Buffer>((resolve) => stream.on('finish', () => resolve(Buffer.concat(chunks))));
};

const seed = async () => {
  await connectDatabase();

  await Promise.all([
    User.deleteMany({}),
    Institution.deleteMany({}),
    Student.deleteMany({}),
    Certificate.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  const adminPassword = await bcrypt.hash('Admin@12345', 12);
  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@blockcertify.com',
    password: adminPassword,
    role: 'admin',
    emailVerified: true,
  });

  const institutionUser = await User.create({
    name: 'Registrar Office',
    email: 'registrar@futureuniversity.edu',
    password: await bcrypt.hash('Welcome@123', 12),
    role: 'institution',
    emailVerified: true,
  });

  const institution = await Institution.create({
    name: 'Future University',
    slug: 'future-university',
    email: 'registrar@futureuniversity.edu',
    website: 'https://futureuniversity.edu',
    contactPerson: 'Registrar Office',
    user: institutionUser._id,
    status: 'approved',
    approvedAt: new Date(),
    description: 'A forward-looking institution for technology and innovation.',
  });
  institutionUser.institution = institution._id;
  await institutionUser.save();

  const studentUser = await User.create({
    name: 'Ava Thompson',
    email: 'student@blockcertify.com',
    password: await bcrypt.hash('Welcome@123', 12),
    role: 'student',
    emailVerified: true,
  });

  const student = await Student.create({
    user: studentUser._id,
    institution: institution._id,
    studentId: 'STU-001',
    name: 'Ava Thompson',
    email: 'student@blockcertify.com',
    degree: 'Bachelor of Science',
    course: 'Computer Science',
    department: 'Engineering',
    graduationYear: 2025,
  });
  studentUser.student = student._id;
  await studentUser.save();

  await Setting.create({
    key: 'platform',
    description: 'Main platform settings',
    value: {
      platformName: 'BlockCertify',
      maintenanceMode: false,
      defaultTheme: 'crystal-glass',
      supportEmail: 'support@blockcertify.com',
    },
  });

  // Issue one real sample certificate through the full pipeline (hash, IPFS
  // pin or local fallback, on-chain write, MongoDB record) so the demo has
  // something to show and verify immediately after seeding. This step needs
  // your local Hardhat node running with the contract deployed and
  // ETH_CONTRACT_ADDRESS set -- if that isn't ready yet, we skip it instead
  // of failing the whole seed run.
  let sampleCertificateId: string | null = null;
  try {
    const pdfBuffer = await buildSampleCertificatePdf();
    const certificate = await issueCertificate({
      payload: {
        studentName: student.name,
        studentId: student.studentId,
        email: student.email,
        degree: student.degree,
        course: student.course,
        department: student.department,
        institutionId: institution.id,
        institutionName: institution.name,
        graduationYear: student.graduationYear,
        issueDate: new Date().toISOString().slice(0, 10),
      },
      pdfBuffer,
      pdfFileName: 'sample-certificate.pdf',
      actorId: institutionUser.id,
    });
    sampleCertificateId = certificate.certificateId;
  } catch (error) {
    console.warn(
      'Skipped creating a sample certificate (this is fine -- it just means your local blockchain node/contract were not reachable yet).'
    );
    console.warn('Reason:', error instanceof Error ? error.message : error);
    console.warn('You can issue certificates from the Institution dashboard once the chain is running.');
  }

  console.log('\nSeed completed.');
  console.log('  Admin:       admin@blockcertify.com / Admin@12345');
  console.log('  Institution: registrar@futureuniversity.edu / Welcome@123');
  console.log('  Student:     student@blockcertify.com / Welcome@123');
  if (sampleCertificateId) {
    console.log(`  Sample certificate ready to verify: ${sampleCertificateId}`);
  }
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
