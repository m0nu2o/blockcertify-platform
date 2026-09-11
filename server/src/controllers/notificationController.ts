
import { Request, Response } from 'express';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({ user: req.user!._id }).sort({ createdAt: -1 });
  return sendSuccess(res, notifications, 'Notifications fetched');
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user!._id }, { read: true }, { new: true });
  return sendSuccess(res, notification, 'Notification marked as read');
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ user: req.user!._id, read: false }, { read: true });
  return sendSuccess(res, null, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
  return sendSuccess(res, null, 'Notification deleted');
});
