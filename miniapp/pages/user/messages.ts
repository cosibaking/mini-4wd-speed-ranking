import { ensureLogin } from '../../services/auth';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_TYPE_LABEL,
} from '../../services/notification';
import type { NotificationItem } from '../../types';

const TAB_INDEX_USER = 3;

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

Page({
  data: {
    messages: [] as Array<NotificationItem & { typeLabel: string; timeLabel: string }>,
    loading: true,
    hasMore: false,
    page: 1,
    markingAll: false,
  },

  async onLoad() {
    await ensureLogin();
    this.loadMessages(true);
  },

  async onShow() {
    await this.loadMessages(true);
  },

  async loadMessages(reset = false) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    try {
      const res = await getNotifications({ page, pageSize: 20 });
      const mapped = res.list.map((item) => ({
        ...item,
        typeLabel: NOTIFICATION_TYPE_LABEL[item.type],
        timeLabel: formatTime(item.createdAt),
      }));
      this.setData({
        messages: reset ? mapped : [...this.data.messages, ...mapped],
        page: page + 1,
        hasMore: res.hasMore,
        loading: false,
      });
    } catch {
      this.setData({ loading: false });
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMessages(false);
    }
  },

  async onMarkAllRead() {
    if (this.data.markingAll) return;
    this.setData({ markingAll: true });
    try {
      await markAllNotificationsRead();
      wx.removeTabBarBadge({ index: TAB_INDEX_USER });
      await this.loadMessages(true);
    } catch {
      wx.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      this.setData({ markingAll: false });
    }
  },

  async onTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const linkPath = e.currentTarget.dataset.link as string | undefined;
    const item = this.data.messages.find((msg) => msg.id === id);
    if (!item) return;

    if (!item.isRead) {
      try {
        await markNotificationRead(id);
        const messages = this.data.messages.map((msg) =>
          msg.id === id ? { ...msg, isRead: true } : msg,
        );
        this.setData({ messages });
      } catch {
        // ignore
      }
    }

    if (linkPath) {
      wx.navigateTo({ url: linkPath });
    }
  },
});
