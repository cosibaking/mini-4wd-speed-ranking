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
    nicknameDraft: '',
    showNicknameInput: true,
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
    this.setData({
      editingNickname: true,
      nicknameDraft: '',
      showNicknameInput: true,
    });
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    const value = e.detail.value;
    this.setData({ nicknameDraft: value, nickName: value });
  },

  onNicknameChange(e: WechatMiniprogram.Input) {
    const value = e.detail.value.trim();
    if (!value) return;

    const prev = this.data.nicknameDraft;
    if (value === prev) {
      this.setData({ nickName: value });
      return;
    }
    if (prev && value.startsWith(prev)) {
      this.setData({ nicknameDraft: value, nickName: value });
      return;
    }

    // 点击「用微信昵称」时 bindchange 会触发，重挂载输入框以刷新显示
    this.setData({ showNicknameInput: false, nicknameDraft: '' }, () => {
      this.setData({
        showNicknameInput: true,
        nicknameDraft: value,
        nickName: value,
      });
    });
  },

  onCancelNickname() {
    const user = this.data.user;
    this.setData({
      editingNickname: false,
      nickName: user?.nickName || '',
      nicknameDraft: '',
      showNicknameInput: true,
    });
  },

  async onSaveNickname() {
    const nickName = (this.data.nicknameDraft || this.data.nickName).trim();
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
