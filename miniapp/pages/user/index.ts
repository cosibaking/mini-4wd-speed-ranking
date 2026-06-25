import { getAdminDashboard } from '../../services/admin';
import { login, refreshUser } from '../../services/auth';
import { getUnreadNotificationCount } from '../../services/notification';
import { getSessionUser } from '../../stores/session';
import type { UserProfile } from '../../types';

const TAB_INDEX_USER = 3;

Page({
  data: {
    user: null as UserProfile | null,
    loggedIn: false,
    unreadCount: 0,
    adminHasPending: false,
    loggingIn: false,
  },

  onShow() {
    this.loadUser();
  },

  async refreshAdminBadge() {
    const { user, loggedIn } = this.data;
    if (!loggedIn || !user?.isAdmin) {
      this.setData({ adminHasPending: false });
      return;
    }
    try {
      const stats = await getAdminDashboard();
      this.setData({ adminHasPending: stats.pendingApplications > 0 });
    } catch {
      // ignore badge errors
    }
  },

  async refreshUnreadBadge() {
    if (!this.data.loggedIn) {
      this.setData({ unreadCount: 0 });
      wx.removeTabBarBadge({ index: TAB_INDEX_USER });
      return;
    }
    try {
      const { count } = await getUnreadNotificationCount();
      this.setData({ unreadCount: count });
      if (count > 0) {
        wx.setTabBarBadge({
          index: TAB_INDEX_USER,
          text: count > 99 ? '99+' : String(count),
        });
      } else {
        wx.removeTabBarBadge({ index: TAB_INDEX_USER });
      }
    } catch {
      // ignore badge errors
    }
  },

  async loadUser() {
    try {
      const user = await refreshUser();
      if (user) {
        this.setData({ user, loggedIn: true });
        await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
        return;
      }
      const cached = getSessionUser();
      this.setData({
        user: cached,
        loggedIn: false,
        unreadCount: 0,
        adminHasPending: false,
      });
      wx.removeTabBarBadge({ index: TAB_INDEX_USER });
    } catch {
      this.setData({ user: null, loggedIn: false, unreadCount: 0, adminHasPending: false });
      wx.removeTabBarBadge({ index: TAB_INDEX_USER });
    }
  },

  /** 用户主动点击：微信原生 wx.login 登录 */
  async onLogin() {
    if (this.data.loggingIn) return;
    this.setData({ loggingIn: true });
    wx.showLoading({ title: '登录中...', mask: true });
    try {
      const result = await login();
      this.setData({ user: result.user, loggedIn: true });
      await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ loggingIn: false });
      wx.hideLoading();
    }
  },

  onEditProfile() {
    if (!this.data.loggedIn) return;
    wx.navigateTo({ url: '/pages/user/profile' });
  },

  onNav(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string;
    if (!this.data.loggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录后再继续',
        confirmText: '去登录',
        cancelText: '取消',
      });
      return;
    }
    wx.navigateTo({ url });
  },
});
