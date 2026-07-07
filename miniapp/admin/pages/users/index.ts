import {
  grantAdmin,
  grantOrganizer,
  listAdminUsers,
  revokeAdmin,
  revokeOrganizer,
} from '../../../services/admin';
import type { AdminUserItem } from '../../../services/admin';

function filterUsers(list: AdminUserItem[], keyword: string): AdminUserItem[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return list;
  return list.filter((user) => {
    const name = (user.nickName || '微信用户').toLowerCase();
    return name.includes(q);
  });
}

Page({
  data: {
    allList: [] as AdminUserItem[],
    list: [] as AdminUserItem[],
    keyword: '',
    loading: true,
  },

  onLoad() {
    this.loadList();
  },

  onSendMessage(e: WechatMiniprogram.TouchEvent) {
    const { id, name, avatar } = e.currentTarget.dataset as {
      id: string;
      name?: string;
      avatar?: string;
    };
    const query = [
      `userId=${encodeURIComponent(id)}`,
      `nickName=${encodeURIComponent(name || '微信用户')}`,
      `avatarUrl=${encodeURIComponent(avatar || '')}`,
    ].join('&');
    wx.navigateTo({ url: `/admin/pages/messages/index?${query}` });
  },

  async loadList() {
    try {
      const res = await listAdminUsers({ pageSize: 100 });
      const allList = res.list;
      this.setData({
        allList,
        list: filterUsers(allList, this.data.keyword),
        loading: false,
      });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value;
    this.setData({
      keyword,
      list: filterUsers(this.data.allList, keyword),
    });
  },

  onOpenUser(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/admin/pages/users/detail?id=${id}` });
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
