import { getRecord } from '../../services/record';
import type { RecordDetail } from '../../types';

Page({
  data: {
    record: null as RecordDetail | null,
    loading: true,
  },

  onLoad(options: { id?: string }) {
    if (options.id) this.loadRecord(options.id);
  },

  async loadRecord(id: string) {
    try {
      const record = await getRecord(id);
      this.setData({ record, loading: false });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
});
