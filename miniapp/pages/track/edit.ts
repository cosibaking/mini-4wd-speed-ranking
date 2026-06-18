import { ensureLogin } from '../../services/auth';
import { createTrack, getTrack, updateTrack } from '../../services/track';
import { chooseAndUploadImage, chooseAndUploadVideo } from '../../services/media';
import { getSessionUser } from '../../stores/session';

interface FormData {
  name: string;
  location: { lat: number; lng: number; address: string } | null;
  organizerName: string;
  organizerContact: string;
  lengthMeters: string;
  floorPlanUrls: string[];
  exampleVideoUrl: string;
  ruleNote: string;
}

Page({
  data: {
    step: 1,
    trackId: '',
    isEdit: false,
    form: {
      name: '',
      location: null,
      organizerName: '',
      organizerContact: '',
      lengthMeters: '',
      floorPlanUrls: [],
      exampleVideoUrl: '',
      ruleNote: '',
    } as FormData,
    submitting: false,
  },

  async onLoad(options: { id?: string }) {
    await ensureLogin();
    const user = getSessionUser();
    this.setData({
      'form.organizerName': user?.nickName || '',
    });

    if (options.id) {
      this.setData({ trackId: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑赛道' });
      const track = await getTrack(options.id);
      this.setData({
        form: {
          name: track.name,
          location: track.location,
          organizerName: track.organizerName,
          organizerContact: track.organizerContact || '',
          lengthMeters: track.lengthMeters ? String(track.lengthMeters) : '',
          floorPlanUrls: track.floorPlanUrls || [],
          exampleVideoUrl: track.exampleVideoUrl || '',
          ruleNote: track.ruleNote || '',
        },
      });
    }
  },

  onNameInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.name': e.detail.value });
  },

  onOrganizerNameInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.organizerName': e.detail.value });
  },

  onOrganizerContactInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.organizerContact': e.detail.value });
  },

  onLengthInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.lengthMeters': e.detail.value });
  },

  onRuleNoteInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.ruleNote': e.detail.value });
  },

  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.location': {
            lat: res.latitude,
            lng: res.longitude,
            address: res.address || res.name,
          },
        });
      },
    });
  },

  async onAddFloorPlan() {
    const urls = this.data.form.floorPlanUrls;
    if (urls.length >= 3) {
      wx.showToast({ title: '最多3张', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '上传中' });
      const uploaded = await chooseAndUploadImage('track_floor_plan', 3 - urls.length);
      this.setData({ 'form.floorPlanUrls': [...urls, ...uploaded] });
    } catch {
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onAddVideo() {
    try {
      wx.showLoading({ title: '上传中' });
      const url = await chooseAndUploadVideo('track_example_video');
      this.setData({ 'form.exampleVideoUrl': url });
    } catch {
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  validateStep1(): boolean {
    const { name, location, organizerName } = this.data.form;
    if (!name.trim()) {
      wx.showToast({ title: '请填写赛道名称', icon: 'none' });
      return false;
    }
    if (!location) {
      wx.showToast({ title: '请选择赛道位置', icon: 'none' });
      return false;
    }
    if (!organizerName.trim()) {
      wx.showToast({ title: '请填写主理人名称', icon: 'none' });
      return false;
    }
    return true;
  },

  onNext() {
    if (this.data.step === 1 && !this.validateStep1()) return;
    if (this.data.step < 3) {
      this.setData({ step: this.data.step + 1 });
    }
  },

  onPrev() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1 });
    }
  },

  async onSubmit() {
    if (!this.validateStep1()) {
      this.setData({ step: 1 });
      return;
    }

    const form = this.data.form;
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      location: form.location,
      organizerName: form.organizerName.trim(),
      organizerContact: form.organizerContact.trim() || undefined,
      floorPlanUrls: form.floorPlanUrls,
      exampleVideoUrl: form.exampleVideoUrl || undefined,
      ruleNote: form.ruleNote.trim() || undefined,
    };
    if (form.lengthMeters) {
      payload.lengthMeters = parseInt(form.lengthMeters, 10);
    }

    this.setData({ submitting: true });
    try {
      let track;
      if (this.data.isEdit) {
        track = await updateTrack(this.data.trackId, payload);
      } else {
        track = await createTrack(payload);
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/track/detail?id=${track.id}` });
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提交失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
