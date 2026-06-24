import { ensureLogin } from '../../services/auth';
import { createPost, listBoards } from '../../services/community';
import { chooseAndUploadImage } from '../../services/media';
import type { Board } from '../../types';

Page({
  data: {
    boards: [] as Board[],
    boardId: '',
    title: '',
    content: '',
    images: [] as string[],
    submitting: false,
  },

  async onLoad() {
    await ensureLogin();
    const boards = await listBoards();
    this.setData({ boards, boardId: boards[0]?.id || '' });
  },

  onBoardChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value);
    this.setData({ boardId: this.data.boards[idx]?.id || '' });
  },

  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e: WechatMiniprogram.Input) {
    this.setData({ content: e.detail.value });
  },

  async onAddImage() {
    if (this.data.images.length >= 9) {
      wx.showToast({ title: '最多9张', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '上传中' });
      const urls = await chooseAndUploadImage('post_image', 9 - this.data.images.length);
      this.setData({ images: [...this.data.images, ...urls] });
    } catch {
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onSubmit() {
    const { boardId, title, content, images } = this.data;
    if (!boardId) {
      wx.showToast({ title: '请选择板块', icon: 'none' });
      return;
    }
    if (!title.trim()) {
      wx.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填写正文', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const post = await createPost({
        boardId,
        title: title.trim(),
        content: content.trim(),
        imageUrls: images,
      });
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/community/post?id=${post.id}` });
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '发布失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
