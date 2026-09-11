
import Notification from '../models/Notification.js';

export const createNotification = async ({
  user,
  title,
  message,
  type = 'info',
  link,
  payload,
}: {
  user: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  link?: string;
  payload?: Record<string, unknown>;
}) => {
  return Notification.create({ user, title, message, type, link, payload: payload || {} });
};
