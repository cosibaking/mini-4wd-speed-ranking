import {
  grantAdmin,
  grantOrganizer,
  listAdminUsers,
  revokeAdmin,
  revokeOrganizer,
} from '../../../services/admin';
import type { AdminUserItem } from '../../../services/admin';

Page({
  data: {
    list: [] as AdminUserItem[],
    loading: true,
  },

  onLoad() {
    this.loadList();
  },

  async loadList() {
    try {
      const res = await listAdminUsers({ pageSize: 100 });
      this.setData({ list: res.list, loading: false });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onGrant(e: WechatMiniprogram.TouchEvent) {
    const userId = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '授予主理人',
      content: '确认该用户已完成线下核实？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await grantOrganizer(userId);
          wx.showToast({ title: '已授予', icon: 'success' });
          this.loadList();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },

  onRevoke(e: WechatMiniprogram.TouchEvent) {
    const userId = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '撤销主理人',
      content: '撤销后用户将无法创建/编辑赛道。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await revokeOrganizer(userId);
          wx.showToast({ title: '已撤销', icon: 'success' });
          this.loadList();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },

  onGrantAdmin(e: WechatMiniprogram.TouchEvent) {
    const userId = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '授予管理员',
      content: '确认授予该用户管理后台访问权限？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await grantAdmin(userId);
          wx.showToast({ title: '已授予', icon: 'success' });
          this.loadList();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },

  onRevokeAdmin(e: WechatMiniprogram.TouchEvent) {
    const userId = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '撤销管理员',
      content: '撤销后用户将无法访问管理后台。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await revokeAdmin(userId);
          wx.showToast({ title: '已撤销', icon: 'success' });
          this.loadList();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },
});
