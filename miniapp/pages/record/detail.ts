import { getRecord } from '../../services/record';
import type { RecordDetail } from '../../types';

Page({
  data: {
    recordId: '',
    record: null as RecordDetail | null,
    loading: true,
  },

  onLoad(options: { id?: string }) {
    if (options.id) {
      this.setData({ recordId: options.id });
      this.loadRecord(options.id);
    }
  },

  onShow() {
    const { recordId } = this.data;
    if (recordId) this.loadRecord(recordId, true);
  },

  async loadRecord(id: string, silent = false) {
    if (!silent) this.setData({ loading: true });
    try {
      const record = await getRecord(id);
      this.setData({ record, loading: false });
    } catch {
      if (!silent) {
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }
  },

  onShareAppMessage() {
    const record = this.data.record;
    if (!record || record.status !== 'approved') {
      return { title: '公园四驱·圈速打榜', path: '/pages/index/index' };
    }
    const rankHint = record.isBestRecord && record.rank ? `，排名第 ${record.rank}` : '';
    return {
      title: `${record.user.nickName} 在【${record.trackName}】跑出 ${record.lapTimeDisplay}${rankHint}`,
      path: `/pages/record/detail?id=${record.id}`,
    };
  },
});
