import { getAdminDashboard } from '../../services/admin';
import { getUserProfile, login, logout, refreshUser, updateMe } from '../../services/auth';
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

  /** 用户主动点击：微信授权 + wx.login 登录 */
  async onLogin() {
    if (this.data.loggingIn) return;

    // 必须在点击手势中「同步」调起微信授权，await 之后再调用会丢失手势导致弹窗失败
    let profile: WechatMiniprogram.UserInfo | null = null;
    try {
      profile = await getUserProfile();
    } catch {
      profile = null;
    }

    this.setData({ loggingIn: true });
    wx.showLoading({ title: '登录中...', mask: true });
    try {
      const result = await login();
      let user = result.user;
      if (profile) {
        try {
          user = await updateMe({
            nickName: profile.nickName,
            avatarUrl: profile.avatarUrl,
          });
        } catch {
          // 保留 login 返回的用户资料
        }
      }
      setSessionUser(user);
      this.setData({ user, loggedIn: true });
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

  onLogout() {
    // confirmColor 微信真机支持，但类型定义未收录，故做类型扩展
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#e64340',
      success: (res) => {
        if (!res.confirm) return;
        logout();
        this.setData({ user: null, loggedIn: false, unreadCount: 0, adminHasPending: false });
        wx.removeTabBarBadge({ index: TAB_INDEX_USER });
        wx.showToast({ title: '已退出登录', icon: 'none' });
      },
    } as Parameters<typeof wx.showModal>[0] & { confirmColor?: string });
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
