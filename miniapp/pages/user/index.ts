import { ensureLogin, getUserProfile, refreshUser, updateMe } from '../../services/auth';
import { getSessionUser, setSessionUser } from '../../stores/session';
import type { UserProfile } from '../../types';

Page({
  data: {
    user: null as UserProfile | null,
    loggedIn: false,
  },

  onShow() {
    this.loadUser();
  },

  async loadUser() {
    try {
      const user = await refreshUser();
      if (user) {
        this.setData({ user, loggedIn: true });
        return;
      }
      const cached = getSessionUser();
      if (cached) {
        this.setData({ user: cached, loggedIn: true });
        return;
      }
      const loggedInUser = await ensureLogin();
      setSessionUser(loggedInUser);
      this.setData({ user: loggedInUser, loggedIn: true });
    } catch {
      this.setData({ user: null, loggedIn: false });
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
      } catch {
        setSessionUser(user);
        this.setData({ user, loggedIn: true });
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
