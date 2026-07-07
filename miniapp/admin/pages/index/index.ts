import { requireLogin } from '../../../services/auth';
import { getAdminDashboard } from '../../../services/admin';
import type { AdminDashboard } from '../../../services/admin';

Page({
  data: {
    stats: null as AdminDashboard | null,
  },

  async onLoad() {
    const user = await requireLogin();
    if (!user.isAdmin) {
      wx.showToast({ title: '无管理权限', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.loadStats();
  },

  onShow() {
    if (this.data.stats !== null) {
      this.loadStats();
    }
  },

  async loadStats() {
    try {
      const stats = await getAdminDashboard();
      this.setData({ stats });
    } catch {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onApplications() {
    wx.navigateTo({ url: '/admin/pages/applications/index' });
  },

  onTracks() {
    wx.navigateTo({ url: '/admin/pages/tracks/index' });
  },

  onUsers() {
    wx.navigateTo({ url: '/admin/pages/users/index' });
  },

  onMessages() {
    wx.navigateTo({ url: '/admin/pages/messages/index' });
  },

  onPosts() {
    wx.navigateTo({ url: '/admin/pages/posts/index' });
  },
});
