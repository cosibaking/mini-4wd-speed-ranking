import { ensureLogin } from '../../services/auth';
import { getMyRecords } from '../../services/record';
import type { RecordBrief } from '../../types';

Page({
  data: {
    records: [] as RecordBrief[],
    loading: true,
  },

  async onLoad() {
    await ensureLogin();
    this.loadRecords();
  },

  async loadRecords() {
    try {
      const res = await getMyRecords();
      this.setData({ records: res.list, loading: false });
    } catch {
      this.setData({ loading: false });
    }
  },

  onTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/record/detail?id=${id}` });
  },

  onGoTracks() {
    wx.navigateTo({ url: '/pages/track/list' });
  },
});
