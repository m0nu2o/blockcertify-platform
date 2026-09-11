
import mongoose from 'mongoose';
import Certificate from '../models/Certificate.js';
import Institution from '../models/Institution.js';
import BlockchainTransaction from '../models/BlockchainTransaction.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';

export const getOverviewAnalytics = async () => {
  const [certificatesIssued, certificatesVerified, certificatesRevoked, institutions, students, transactions] = await Promise.all([
    Certificate.countDocuments(),
    Certificate.countDocuments({ verificationCount: { $gt: 0 } }),
    Certificate.countDocuments({ status: 'revoked' }),
    Institution.countDocuments(),
    Student.countDocuments(),
    BlockchainTransaction.countDocuments(),
  ]);

  const monthlyReports = await Certificate.aggregate([
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id': 1 } },
  ]);

  const institutionRankings = await Institution.find().sort({ 'stats.certificatesIssued': -1 }).limit(10);

  return {
    stats: { certificatesIssued, certificatesVerified, certificatesRevoked, institutions, students, transactions },
    monthlyReports,
    institutionRankings,
  };
};

export const getAdminAnalytics = async () => {
  const overview = await getOverviewAnalytics();
  const trafficAnalytics = await Notification.aggregate([
    { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { '_id': 1 } },
  ]);
  return { ...overview, trafficAnalytics };
};

export const getInstitutionAnalytics = async (institutionId?: string) => {
  if (!institutionId || institutionId === 'undefined' || !mongoose.Types.ObjectId.isValid(institutionId)) {
    return { issued: 0, revoked: 0, students: 0, recentCertificates: [] };
  }

  const [issued, revoked, recentCertificates, students] = await Promise.all([
    Certificate.countDocuments({ institution: institutionId }),
    Certificate.countDocuments({ institution: institutionId, status: 'revoked' }),
    Certificate.find({ institution: institutionId }).sort({ createdAt: -1 }).limit(6),
    Student.countDocuments({ institution: institutionId }),
  ]);

  return { issued, revoked, students, recentCertificates };
};

export const getStudentAnalytics = async (studentId?: string) => {
  if (!studentId || studentId === 'undefined') {
    return {
      totalCertificates: 0,
      verifiedCertificates: 0,
      certificates: [],
    };
  }

  const certificates = await Certificate.find({ studentId }).sort({ createdAt: -1 });
  return {
    totalCertificates: certificates.length,
    verifiedCertificates: certificates.filter((item) => item.verificationCount > 0).length,
    certificates,
  };
};
