"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, CheckCircle2, Info, AlertTriangle, XCircle, X, Loader2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
};

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function NotificationDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = session?.user?.accessToken;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch<ApiResponse<NotificationItem[]>>('/notifications', { token });
      setNotifications(res.data ?? []);
    } catch {
      // silently fail — polling should not break UI
    }
  }, [token]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    pollingRef.current = setInterval(() => void fetchNotifications(), 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token, fetchNotifications]);

  // Refetch when dropdown opens
  useEffect(() => {
    if (open && token) void fetchNotifications();
  }, [open, token, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH', token });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH', token });
    } catch { /* optimistic */ }
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
  };

  const removeNotification = async (id: string) => {
    if (!token) return;
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE', token });
    } catch { /* already removed optimistically */ }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="size-4 text-success" />;
      case 'warning': return <AlertTriangle className="size-4 text-warning" />;
      case 'error': return <XCircle className="size-4 text-danger" />;
      default: return <Info className="size-4 text-accent" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success/10 border-success/20';
      case 'warning': return 'bg-warning/10 border-warning/20';
      case 'error': return 'bg-danger/10 border-danger/20';
      default: return 'bg-accent/10 border-accent/20';
    }
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Notifications"
          className="relative h-10 w-10 overflow-hidden hover:bg-foreground/[0.04] transition-colors rounded-2xl border border-transparent hover:border-border/10"
        >
          {loading ? (
            <Loader2 className="size-4 text-foreground/60 animate-spin" />
          ) : (
            <Bell className="size-4 text-foreground/80" />
          )}
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={12} asChild className="z-50">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-80 sm:w-96"
          >
            <GlassCard className="p-0 overflow-hidden border-accent/20 shadow-2xl bg-card/95">
              <div className="flex items-center justify-between p-4 border-b border-border/10 bg-foreground/[0.02]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => void markAllAsRead()}
                    className="text-xs font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                  >
                    <Check className="size-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-hide flex flex-col">
                <AnimatePresence>
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="grid place-items-center size-12 rounded-full bg-foreground/[0.03] mx-auto mb-3">
                        <Bell className="size-5 text-foreground/30" />
                      </div>
                      <p className="text-sm text-foreground/50">You&apos;re all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          'relative p-4 border-b border-border/5 transition-colors group flex gap-3',
                          item.read ? 'bg-transparent opacity-75' : 'bg-foreground/[0.02]'
                        )}
                      >
                        <div className={cn('grid place-items-center size-8 rounded-full border shrink-0', getIconBg(item.type))}>
                          {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={cn('text-sm font-semibold truncate', item.read ? 'text-foreground/70' : 'text-foreground')}>
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-foreground/40 whitespace-nowrap mt-0.5">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/60 leading-relaxed line-clamp-2 pr-4">
                            {item.message}
                          </p>
                        </div>

                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); void removeNotification(item._id); }}
                            className="p-1.5 rounded-full hover:bg-danger/10 hover:text-danger text-foreground/40 transition-colors"
                            aria-label="Remove notification"
                          >
                            <X className="size-3.5" />
                          </button>
                          {!item.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); void markAsRead(item._id); }}
                              className="p-1.5 rounded-full hover:bg-accent/10 hover:text-accent text-foreground/40 transition-colors"
                              aria-label="Mark as read"
                            >
                              <Check className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
