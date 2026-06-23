import { ensureLogin, getMe } from '../../services/auth';
import { getMyOrganizerApplication } from '../../services/organizer';
import { setSessionUser } from '../../stores/session';
import type { OrganizerApplicationBrief } from '../../types';

const STATUS_MAP: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

Page({
  data: {
    application: null as OrganizerApplicationBrief | null,
    statusText: '',
    isOrganizer: false,
  },

  async onLoad() {
    await ensureLogin();
    await this.loadStatus();
  },

  async onShow() {
    await this.loadStatus();
  },

  async loadStatus() {
    try {
      const [user, application] = await Promise.all([getMe(), getMyOrganizerApplication()]);
      setSessionUser(user);
      if (user.isOrganizer) {
        this.setData({ isOrganizer: true, application, statusText: '已通过' });
        return;
      }
      if (!application) {
        wx.redirectTo({ url: '/pages/organizer/apply' });
        return;
      }
      this.setData({
        application,
        statusText: STATUS_MAP[application.status] ?? application.status,
        isOrganizer: false,
      });
    } catch {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onReapply() {
    wx.redirectTo({ url: '/pages/organizer/apply' });
  },

  onGoTracks() {
    wx.redirectTo({ url: '/pages/user/tracks' });
  },
});
