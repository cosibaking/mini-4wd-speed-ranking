import { ensureLogin } from '../../services/auth';
import { getMyRecords } from '../../services/record';
import type { RecordBrief, RecordStatus } from '../../types';

const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '审核中',
  approved: '已认证',
  rejected: '未通过',
};

Page({
  data: {
    records: [] as RecordBrief[],
    loading: true,
    statusLabel: STATUS_LABEL,
  },

  async onLoad() {
    await ensureLogin();
    this.loadRecords();
  },

  onShow() {
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
