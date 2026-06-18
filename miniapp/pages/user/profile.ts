import { ensureLogin, getUserProfile, updateMe } from '../../services/auth';
import { chooseAndUploadImage } from '../../services/media';
import { setSessionUser } from '../../stores/session';
import type { UserProfile } from '../../types';

Page({
  data: {
    user: null as UserProfile | null,
    nickName: '',
    avatarUrl: '',
    editingNickname: false,
    saving: false,
  },

  async onLoad() {
    const user = await ensureLogin();
    this.setData({
      user,
      nickName: user.nickName || '',
      avatarUrl: user.avatarUrl || '',
    });
  },

  onEditAvatar() {
    wx.showModal({
      title: '修改头像',
      content: '是否使用微信头像？',
      confirmText: '使用',
      cancelText: '自定义',
      success: (res) => {
        if (res.confirm) {
          this.useWeChatAvatar();
        } else if (res.cancel) {
          this.chooseCustomAvatar();
        }
      },
    });
  },

  async useWeChatAvatar() {
    try {
      const profile = await getUserProfile();
      await this.saveProfile({ avatarUrl: profile.avatarUrl });
    } catch {
      wx.showToast({ title: '获取微信头像失败', icon: 'none' });
    }
  },

  async chooseCustomAvatar() {
    try {
      const [url] = await chooseAndUploadImage('post_image', 1);
      await this.saveProfile({ avatarUrl: url });
    } catch {
      // 用户取消选择时不提示
    }
  },

  onEditNickname() {
    if (this.data.editingNickname) return;
    wx.showModal({
      title: '修改昵称',
      content: '是否使用微信昵称？',
      confirmText: '使用',
      cancelText: '自定义',
      success: (res) => {
        if (res.confirm) {
          this.useWeChatNickname();
        } else if (res.cancel) {
          this.setData({ editingNickname: true });
        }
      },
    });
  },

  async useWeChatNickname() {
    try {
      const profile = await getUserProfile();
      await this.saveProfile({ nickName: profile.nickName });
    } catch {
      wx.showToast({ title: '获取微信昵称失败', icon: 'none' });
    }
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({ nickName: e.detail.value });
  },

  onCancelNickname() {
    const user = this.data.user;
    this.setData({
      editingNickname: false,
      nickName: user?.nickName || '',
    });
  },

  async onSaveNickname() {
    const nickName = this.data.nickName.trim();
    if (!nickName) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    await this.saveProfile({ nickName });
    this.setData({ editingNickname: false });
  },

  async saveProfile(data: { nickName?: string; avatarUrl?: string }) {
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
      const updated = await updateMe(data);
      setSessionUser(updated);
      this.setData({
        user: updated,
        nickName: updated.nickName,
        avatarUrl: updated.avatarUrl,
        saving: false,
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch {
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
});
