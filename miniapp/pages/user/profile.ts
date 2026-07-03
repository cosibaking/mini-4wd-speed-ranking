import { requireLogin, updateMe } from '../../services/auth';
import { uploadLocalImage } from '../../services/media';
import { setSessionUser } from '../../stores/session';
import { guardLogin } from '../../utils/nav';
import type { UserProfile } from '../../types';

Page({
  data: {
    user: null as UserProfile | null,
    nickName: '',
    avatarUrl: '',
    editingNickname: false,
    editingBio: false,
    saving: false,
    nicknameDraft: '',
    bio: '',
    bioDraft: '',
    showNicknameInput: true,
  },

  async onLoad() {
    if (!(await guardLogin())) return;
    const user = await requireLogin();
    this.setData({
      user,
      nickName: user.nickName || '',
      avatarUrl: user.avatarUrl || '',
      bio: user.bio || '',
    });
  },

  async onChooseWeChatAvatar(e: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) return;

    const previousAvatar = this.data.avatarUrl;
    this.setData({ avatarUrl: tempPath });

    try {
      wx.showLoading({ title: '上传中...', mask: true });
      const url = await uploadLocalImage(tempPath, 'post_image');
      await this.saveProfile({ avatarUrl: url });
    } catch (err) {
      console.error('[profile] avatar upload failed', err);
      this.setData({ avatarUrl: previousAvatar });
      const msg = err instanceof Error ? err.message : '头像上传失败';
      wx.showToast({ title: msg.length > 20 ? '头像上传失败' : msg, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onEditNickname() {
    if (this.data.editingNickname || this.data.editingBio) return;
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

  onEditBio() {
    if (this.data.editingBio || this.data.editingNickname) return;
    this.setData({
      editingBio: true,
      bioDraft: this.data.bio,
    });
  },

  onBioInput(e: WechatMiniprogram.Input) {
    this.setData({ bioDraft: e.detail.value });
  },

  onCancelBio() {
    const user = this.data.user;
    this.setData({
      editingBio: false,
      bio: user?.bio || '',
      bioDraft: '',
    });
  },

  async onSaveBio() {
    const bio = (this.data.bioDraft ?? this.data.bio).trim();
    await this.saveProfile({ bio });
    this.setData({ editingBio: false, bio, bioDraft: '' });
  },

  async saveProfile(data: { nickName?: string; avatarUrl?: string; bio?: string }) {
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
      const updated = await updateMe(data);
      setSessionUser(updated);
      this.setData({
        user: updated,
        nickName: updated.nickName,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio || '',
        saving: false,
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch {
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
});
