import { requireLogin } from '../../services/auth';
import { getTrackRecords } from '../../services/record';
import { guardLogin } from '../../utils/nav';
import type { RecordBrief, RecordStatus } from '../../types';

const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
};

type TabStatus = RecordStatus | 'all';

Page({
  data: {
    trackId: '',
    trackName: '',
    status: 'pending' as TabStatus,
    list: [] as RecordBrief[],
    loading: true,
    statusLabel: STATUS_LABEL,
  },

  async onLoad(options: { trackId?: string; trackName?: string }) {
    if (!(await guardLogin())) return;
    await requireLogin();
    if (!options.trackId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    this.setData({
      trackId: options.trackId,
      trackName: options.trackName ? decodeURIComponent(options.trackName) : '',
    });
    this.loadRecords();
  },

  onShow() {
    if (this.data.trackId) {
      this.loadRecords();
    }
  },

  async loadRecords() {
    const { trackId, status } = this.data;
    this.setData({ loading: true });
    try {
      const query = status === 'all' ? {} : { status };
      const res = await getTrackRecords(trackId, { ...query, pageSize: 50 });
      this.setData({ list: res.list, loading: false });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onTabChange(e: WechatMiniprogram.TouchEvent) {
    const status = e.currentTarget.dataset.status as TabStatus;
    this.setData({ status });
    this.loadRecords();
  },

  onTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/organizer/review?id=${id}` });
  },
});
