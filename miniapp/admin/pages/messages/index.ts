import { requireLogin } from '../../../services/auth';
import {
  getAdminDashboard,
  listAdminUsers,
  sendAdminNotification,
} from '../../../services/admin';
import type { AdminUserItem } from '../../../services/admin';

type SendMode = 'single' | 'broadcast';

type DisplayUser = AdminUserItem & { selected: boolean };

function filterUsersByKeyword(users: AdminUserItem[], keyword: string): AdminUserItem[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return users;
  return users.filter((user) => (user.nickName || '微信用户').toLowerCase().includes(kw));
}

function buildDisplayUsers(
  users: AdminUserItem[],
  keyword: string,
  selectedUserIds: string[],
): DisplayUser[] {
  const selectedSet = new Set(selectedUserIds);
  return filterUsersByKeyword(users, keyword).map((user) => ({
    ...user,
    selected: selectedSet.has(user.id),
  }));
}

Page({
  data: {
    mode: 'single' as SendMode,
    title: '',
    content: '',
    users: [] as AdminUserItem[],
    displayUsers: [] as DisplayUser[],
    selectedUserIds: [] as string[],
    selectedCount: 0,
    userSearch: '',
    userCount: 0,
    loadingUsers: true,
    submitting: false,
  },

  async onLoad(options: Record<string, string | undefined>) {
    const user = await requireLogin();
    if (!user.isAdmin) {
      wx.showToast({ title: '无管理权限', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    await Promise.all([this.loadUsers(), this.loadUserCount()]);

    const presetUserId = options.userId;
    if (presetUserId) {
      this.setData({
        mode: 'single',
        selectedUserIds: [presetUserId],
        selectedCount: 1,
      });
      this.refreshDisplayUsers();
    }
  },

  refreshDisplayUsers() {
    const { users, userSearch, selectedUserIds } = this.data;
    this.setData({
      displayUsers: buildDisplayUsers(users, userSearch, selectedUserIds),
      selectedCount: selectedUserIds.length,
    });
  },

  async loadUsers() {
    this.setData({ loadingUsers: true });
    try {
      const res = await listAdminUsers({ pageSize: 100 });
      this.setData({ users: res.list, loadingUsers: false });
      this.refreshDisplayUsers();
    } catch {
      this.setData({ loadingUsers: false });
      wx.showToast({ title: '用户列表加载失败', icon: 'none' });
    }
  },

  async loadUserCount() {
    try {
      const stats = await getAdminDashboard();
      this.setData({ userCount: stats.userCount });
    } catch {
      // ignore
    }
  },

  onModeChange(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as SendMode;
    this.setData({ mode });
  },

  onUserSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ userSearch: e.detail.value });
    this.refreshDisplayUsers();
  },

  onClearUserSearch() {
    this.setData({ userSearch: '' });
    this.refreshDisplayUsers();
  },

  onToggleUser(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset as { id: string };
    const selectedUserIds = [...this.data.selectedUserIds];
    const index = selectedUserIds.indexOf(id);
    if (index >= 0) {
      selectedUserIds.splice(index, 1);
    } else {
      selectedUserIds.push(id);
    }
    this.setData({ selectedUserIds });
    this.refreshDisplayUsers();
  },

  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e: WechatMiniprogram.Input) {
    this.setData({ content: e.detail.value });
  },

  onSubmit() {
    const { mode, title, content, selectedUserIds, userCount, submitting } = this.data;
    if (submitting) return;

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    if (!trimmedContent) {
      wx.showToast({ title: '请填写内容', icon: 'none' });
      return;
    }
    if (mode === 'single' && selectedUserIds.length === 0) {
      wx.showToast({ title: '请选择接收用户', icon: 'none' });
      return;
    }

    let confirmContent = '';
    if (mode === 'broadcast') {
      confirmContent = `确认向全部 ${userCount} 位用户发送站内信？`;
    } else if (selectedUserIds.length === 1) {
      const user = this.data.users.find((item) => item.id === selectedUserIds[0]);
      confirmContent = `确认向「${user?.nickName || '微信用户'}」发送站内信？`;
    } else {
      confirmContent = `确认向 ${selectedUserIds.length} 位用户发送站内信？`;
    }

    wx.showModal({
      title: mode === 'broadcast' ? '确认群发' : '确认发送',
      content: confirmContent,
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        try {
          const result = await sendAdminNotification({
            title: trimmedTitle,
            content: trimmedContent,
            userIds: mode === 'single' ? selectedUserIds : undefined,
          });
          wx.showToast({
            title: mode === 'broadcast' ? `已发送 ${result.sent} 人` : `已发送 ${result.sent} 人`,
            icon: 'success',
          });
          setTimeout(() => wx.navigateBack(), 800);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '发送失败';
          wx.showToast({ title: msg, icon: 'none' });
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },
});
