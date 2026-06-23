import {
  approveOrganizerApplication,
  listOrganizerApplications,
  rejectOrganizerApplication,
} from '../../../services/admin';
import type { AdminApplicationItem } from '../../../services/admin';

Page({
  data: {
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    list: [] as AdminApplicationItem[],
    loading: true,
  },

  onLoad() {
    this.loadList();
  },

  onTabChange(e: WechatMiniprogram.TouchEvent) {
    const status = e.currentTarget.dataset.status as 'pending' | 'approved' | 'rejected';
    this.setData({ status });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await listOrganizerApplications({ status: this.data.status, pageSize: 50 });
      this.setData({ list: res.list, loading: false });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onApprove(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '确认通过',
      content: '请确认已完成线下核实。通过后用户可创建赛道。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await approveOrganizerApplication(id);
          wx.showToast({ title: '已通过', icon: 'success' });
          this.loadList();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },

  onReject(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '拒绝申请',
      content: '确认拒绝该主理人申请？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await rejectOrganizerApplication(id);
          wx.showToast({ title: '已拒绝', icon: 'success' });
          this.loadList();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },
});
