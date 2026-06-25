import { requireLogin } from '../../services/auth';
import { approveRecord, getRecord, rejectRecord } from '../../services/record';
import { isValidLapTimeInput } from '../../utils/lapTime';
import { guardLogin } from '../../utils/nav';
import type { RecordDetail } from '../../types';

Page({
  data: {
    record: null as RecordDetail | null,
    loading: true,
    submitting: false,
    lapTimeDisplay: '',
    lapTimeValid: true,
    reviewNote: '',
    rejectNote: '',
    showRejectModal: false,
    readonly: false,
  },

  async onLoad(options: { id?: string }) {
    if (!(await guardLogin())) return;
    await requireLogin();
    if (options.id) {
      await this.loadRecord(options.id);
    }
  },

  async loadRecord(id: string) {
    try {
      const record = await getRecord(id);
      this.setData({
        record,
        loading: false,
        lapTimeDisplay: record.submittedLapTimeDisplay,
        readonly: record.status !== 'pending',
      });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onLapTimeChange(e: WechatMiniprogram.CustomEvent) {
    const { value, valid } = e.detail as { value: string; valid: boolean };
    this.setData({ lapTimeDisplay: value, lapTimeValid: valid });
  },

  onNoteInput(e: WechatMiniprogram.Input) {
    this.setData({ reviewNote: e.detail.value });
  },

  onRejectNoteInput(e: WechatMiniprogram.Input) {
    this.setData({ rejectNote: e.detail.value });
  },

  onShowReject() {
    this.setData({ showRejectModal: true, rejectNote: '' });
  },

  onCancelReject() {
    this.setData({ showRejectModal: false, rejectNote: '' });
  },

  async onApprove() {
    const { record, lapTimeDisplay, reviewNote, submitting, readonly } = this.data;
    if (!record || readonly || submitting) return;
    if (!isValidLapTimeInput(lapTimeDisplay)) {
      wx.showToast({ title: '圈速格式不正确', icon: 'none' });
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: '确认通过',
        content: `认定圈速：${lapTimeDisplay}`,
        success: (res) => resolve(res.confirm),
      });
    });
    if (!confirmed) return;

    this.setData({ submitting: true });
    try {
      await approveRecord(record.id, {
        lapTimeDisplay,
        reviewNote: reviewNote.trim() || undefined,
      });
      wx.showToast({ title: '已通过', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '操作失败', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  async onConfirmReject() {
    const { record, rejectNote, submitting, readonly } = this.data;
    if (!record || readonly || submitting) return;
    const reviewNote = rejectNote.trim();
    if (!reviewNote) {
      wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await rejectRecord(record.id, { reviewNote });
      wx.showToast({ title: '已拒绝', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 800);
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '操作失败', icon: 'none' });
      this.setData({ submitting: false });
    }
  },
});
