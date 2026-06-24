import { ensureLogin, getUser } from '../../services/auth';
import { toggleFollow } from '../../services/community';
import { getSessionUser } from '../../stores/session';
import type { PublicUserDetail } from '../../types';

Page({
  data: {
    user: null as PublicUserDetail | null,
    isSelf: false,
    following: undefined as boolean | undefined,
    followLoading: false,
    loading: true,
  },

  onLoad(options: { id?: string }) {
    if (options.id) this.loadUser(options.id);
    else this.setData({ loading: false });
  },

  async loadUser(id: string) {
    try {
      const user = await getUser(id);
      const sessionUser = getSessionUser();
      const isSelf = sessionUser?.id === user.id;
      this.setData({
        user,
        isSelf,
        following: user.following,
        loading: false,
      });
    } catch {
      this.setData({ user: null, loading: false });
    }
  },

  async onToggleFollow() {
    const user = this.data.user;
    if (!user) return;
    try {
      await ensureLogin();
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    if (this.data.followLoading) return;
    this.setData({ followLoading: true });
    try {
      const res = await toggleFollow(user.id);
      this.setData({ following: res.following, followLoading: false });
      wx.showToast({ title: res.following ? '已关注' : '已取消', icon: 'none' });
    } catch (err) {
      this.setData({ followLoading: false });
      const msg = err instanceof Error ? err.message : '操作失败';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/user/profile' });
  },
});
