import { getAdminDashboard } from '../../services/admin';
import { ensureLogin, getUserProfile, refreshUser, updateMe } from '../../services/auth';
import { getUnreadNotificationCount } from '../../services/notification';
import { getSessionUser, setSessionUser } from '../../stores/session';
import type { UserProfile } from '../../types';

const TAB_INDEX_USER = 3;

Page({
  data: {
    user: null as UserProfile | null,
    loggedIn: false,
    unreadCount: 0,
    adminHasPending: false,
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
      if (cached) {
        this.setData({ user: cached, loggedIn: true });
        await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
        return;
      }
      const loggedInUser = await ensureLogin();
      setSessionUser(loggedInUser);
      this.setData({ user: loggedInUser, loggedIn: true });
      await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
    } catch {
      this.setData({ user: null, loggedIn: false, unreadCount: 0, adminHasPending: false });
      wx.removeTabBarBadge({ index: TAB_INDEX_USER });
    }
  },

  async onLogin() {
    try {
      const user = await ensureLogin();
      try {
        const profile = await getUserProfile();
        const updated = await updateMe({
          nickName: profile.nickName,
          avatarUrl: profile.avatarUrl,
        });
        setSessionUser(updated);
        this.setData({ user: updated, loggedIn: true });
        await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
      } catch {
        setSessionUser(user);
        this.setData({ user, loggedIn: true });
        await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
      }
    } catch {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  onEditProfile() {
    if (!this.data.loggedIn) return;
    wx.navigateTo({ url: '/pages/user/profile' });
  },

  onNav(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string;
    if (!this.data.loggedIn) {
      this.onLogin().then(() => {
        if (this.data.loggedIn) wx.navigateTo({ url });
      });
      return;
    }
    wx.navigateTo({ url });
  },
});
