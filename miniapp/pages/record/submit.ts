import { ensureLogin } from '../../services/auth';
import { submitRecord } from '../../services/record';
import { getTrack } from '../../services/track';
import { chooseAndUploadImage, chooseAndUploadVideo } from '../../services/media';
import type { TrackDetail } from '../../types';

Page({
  data: {
    trackId: '',
    track: null as TrackDetail | null,
    lapTime: '',
    lapTimeValid: false,
    videoUrl: '',
    configType: 'text' as 'text' | 'image',
    configText: '',
    configImageUrl: '',
    carPhotoUrls: [] as string[],
    note: '',
    submitting: false,
  },

  async onLoad(options: { trackId?: string }) {
    await ensureLogin();
    if (options.trackId) {
      const track = await getTrack(options.trackId);
      this.setData({ trackId: options.trackId, track });
    }
  },

  onLapTimeChange(e: WechatMiniprogram.CustomEvent) {
    const { value, valid } = e.detail;
    this.setData({ lapTime: value, lapTimeValid: valid });
  },

  async onUploadVideo() {
    try {
      wx.showLoading({ title: '上传中' });
      const url = await chooseAndUploadVideo('record_video');
      this.setData({ videoUrl: url });
    } catch {
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onConfigTypeChange(e: WechatMiniprogram.RadioGroupChange) {
    this.setData({ configType: e.detail.value as 'text' | 'image' });
  },

  onConfigTextInput(e: WechatMiniprogram.Input) {
    this.setData({ configText: e.detail.value });
  },

  async onUploadConfigImage() {
    try {
      wx.showLoading({ title: '上传中' });
      const urls = await chooseAndUploadImage('record_config', 1);
      this.setData({ configImageUrl: urls[0] });
    } catch {
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onAddCarPhoto() {
    if (this.data.carPhotoUrls.length >= 3) {
      wx.showToast({ title: '最多3张', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '上传中' });
      const urls = await chooseAndUploadImage('record_car_photo', 3 - this.data.carPhotoUrls.length);
      this.setData({ carPhotoUrls: [...this.data.carPhotoUrls, ...urls] });
    } catch {
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onNoteInput(e: WechatMiniprogram.Input) {
    this.setData({ note: e.detail.value });
  },

  async onSubmit() {
    const { trackId, lapTime, lapTimeValid, videoUrl, configType, configText, configImageUrl, carPhotoUrls, note } = this.data;

    if (!trackId) {
      wx.showToast({ title: '请选择赛道', icon: 'none' });
      return;
    }
    if (!lapTimeValid || !lapTime) {
      wx.showToast({ title: '请填写正确圈速', icon: 'none' });
      return;
    }
    if (!videoUrl) {
      wx.showToast({ title: '请上传认定视频', icon: 'none' });
      return;
    }

    let configSheet: Record<string, unknown> | undefined;
    if (configType === 'text' && configText.trim()) {
      configSheet = { type: 'text', content: configText.trim() };
    } else if (configType === 'image' && configImageUrl) {
      configSheet = { type: 'image', url: configImageUrl };
    }

    this.setData({ submitting: true });
    try {
      await submitRecord({
        trackId,
        lapTimeDisplay: lapTime,
        videoUrl,
        configSheet,
        carPhotoUrls: carPhotoUrls.length ? carPhotoUrls : undefined,
        note: note.trim() || undefined,
      });
      wx.redirectTo({ url: `/pages/record/success?trackId=${trackId}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提交失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
