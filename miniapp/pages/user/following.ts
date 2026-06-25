import { requireLogin } from '../../services/auth';
import { listFollowing } from '../../services/community';
import { guardLogin } from '../../utils/nav';
import type { PublicUser } from '../../types';

Page({
  data: {
    users: [] as PublicUser[],
    loading: true,
  },

  async onLoad() {
    if (!(await guardLogin())) return;
    await requireLogin();
    this.loadFollowing();
  },

  async loadFollowing() {
    try {
      const res = await listFollowing();
      this.setData({ users: res.list, loading: false });
    } catch {
      this.setData({ loading: false });
    }
  },

  onGoCommunity() {
    wx.switchTab({ url: '/pages/community/index' });
  },
});
