import { requireLogin } from '../../services/auth';
import {
  getNotification,
  getUnreadNotificationCount,
  markNotificationRead,
  NOTIFICATION_TYPE_LABEL,
} from '../../services/notification';
import { guardLogin } from '../../utils/nav';
import type { NotificationItem } from '../../types';

const TAB_INDEX_USER = 3;

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

Page({
  data: {
    message: null as (NotificationItem & { typeLabel: string; timeLabel: string }) | null,
    loading: true,
  },

  async onLoad(options: Record<string, string | undefined>) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '消息不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    if (!(await guardLogin())) return;
    await requireLogin();
    await this.loadMessage(id);
  },

  async loadMessage(id: string) {
    this.setData({ loading: true });
    try {
      const item = await getNotification(id);
      if (item.payload?.linkPath) {
        wx.redirectTo({ url: item.payload.linkPath });
        return;
      }

      if (!item.isRead) {
        try {
          await markNotificationRead(id);
          const { count } = await getUnreadNotificationCount();
          if (count > 0) {
            wx.setTabBarBadge({
              index: TAB_INDEX_USER,
              text: count > 99 ? '99+' : String(count),
            });
          } else {
            wx.removeTabBarBadge({ index: TAB_INDEX_USER });
          }
        } catch {
          // ignore
        }
      }

      this.setData({
        message: {
          ...item,
          typeLabel: NOTIFICATION_TYPE_LABEL[item.type],
          timeLabel: formatTime(item.createdAt),
        },
        loading: false,
      });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '消息不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
    }
  },
});
