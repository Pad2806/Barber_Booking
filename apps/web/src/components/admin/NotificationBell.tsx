'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, NotificationItem } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TYPE_ICONS: Record<string, { emoji: string; color: string }> = {
  BOOKING_CREATED: { emoji: '📅', color: 'bg-blue-50 text-blue-600' },
  BOOKING_CANCELLED: { emoji: '❌', color: 'bg-red-50 text-red-600' },
  PAYMENT_RECEIVED: { emoji: '💰', color: 'bg-green-50 text-green-600' },
  REVIEW_RECEIVED: { emoji: '⭐', color: 'bg-yellow-50 text-yellow-600' },
  SYSTEM: { emoji: '🔔', color: 'bg-slate-50 text-slate-600' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch unread count — poll every 30s
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 30000,
  });

  // Fetch notifications list
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApi.getAll({ limit: 20 }),
    enabled: isOpen,
    refetchInterval: isOpen ? 15000 : false,
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = notificationsData?.data || [];

  // Mark as read
  const markReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification
  const deleteMutation = useMutation({
    mutationFn: notificationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleNotificationClick = useCallback((notif: NotificationItem) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
  }, [markReadMutation]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-slate-500 rounded-full relative"
        onClick={() => setIsOpen(o => !o)}
      >
        <Bell className={cn("w-5 h-5 transition-transform", isOpen && "scale-110")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-in zoom-in duration-200 shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800">Thông báo</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-2 py-1 rounded-md hover:bg-primary/5 transition-colors"
                  disabled={markAllReadMutation.isPending}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc tất cả
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-slate-200 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-slate-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const typeInfo = TYPE_ICONS[notif.type] || TYPE_ICONS.SYSTEM;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "px-4 py-3 flex gap-3 cursor-pointer transition-colors group",
                      notif.isRead
                        ? "bg-white hover:bg-slate-50"
                        : "bg-primary/[0.03] hover:bg-primary/[0.06]"
                    )}
                  >
                    {/* Icon */}
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0", typeInfo.color)}>
                      {typeInfo.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", notif.isRead ? "text-slate-600" : "text-slate-900 font-semibold")}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{timeAgo(notif.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notif.id); }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-primary transition-colors"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
