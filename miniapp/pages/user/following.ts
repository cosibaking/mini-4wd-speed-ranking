import { ensureLogin } from '../../services/auth';
import { listFollowing } from '../../services/community';
import type { PublicUser } from '../../types';

Page({
  data: {
    users: [] as PublicUser[],
    loading: true,
  },

  async onLoad() {
    await ensureLogin();
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
