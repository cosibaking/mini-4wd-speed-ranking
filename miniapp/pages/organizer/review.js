"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const record_1 = require("../../services/record");
const lapTime_1 = require("../../utils/lapTime");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        record: null,
        loading: true,
        submitting: false,
        lapTimeDisplay: '',
        lapTimeValid: true,
        reviewNote: '',
        rejectNote: '',
        showRejectModal: false,
        readonly: false,
    },
    async onLoad(options) {
        if (!(await (0, nav_1.guardLogin)()))
            return;
        await (0, auth_1.requireLogin)();
        if (options.id) {
            await this.loadRecord(options.id);
        }
    },
    async loadRecord(id) {
        try {
            const record = await (0, record_1.getRecord)(id);
            this.setData({
                record,
                loading: false,
                lapTimeDisplay: record.submittedLapTimeDisplay,
                readonly: record.status !== 'pending',
            });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onLapTimeChange(e) {
        const { value, valid } = e.detail;
        this.setData({ lapTimeDisplay: value, lapTimeValid: valid });
    },
    onNoteInput(e) {
        this.setData({ reviewNote: e.detail.value });
    },
    onRejectNoteInput(e) {
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
        if (!record || readonly || submitting)
            return;
        if (!(0, lapTime_1.isValidLapTimeInput)(lapTimeDisplay)) {
            wx.showToast({ title: '圈速格式不正确', icon: 'none' });
            return;
        }
        const confirmed = await new Promise((resolve) => {
            wx.showModal({
                title: '确认通过',
                content: `认定圈速：${lapTimeDisplay}`,
                success: (res) => resolve(res.confirm),
            });
        });
        if (!confirmed)
            return;
        this.setData({ submitting: true });
        try {
            await (0, record_1.approveRecord)(record.id, {
                lapTimeDisplay,
                reviewNote: reviewNote.trim() || undefined,
            });
            wx.showToast({ title: '已通过', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 800);
        }
        catch (e) {
            wx.showToast({ title: e.message || '操作失败', icon: 'none' });
            this.setData({ submitting: false });
        }
    },
    async onConfirmReject() {
        const { record, rejectNote, submitting, readonly } = this.data;
        if (!record || readonly || submitting)
            return;
        const reviewNote = rejectNote.trim();
        if (!reviewNote) {
            wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
            return;
        }
        this.setData({ submitting: true });
        try {
            await (0, record_1.rejectRecord)(record.id, { reviewNote });
            wx.showToast({ title: '已拒绝', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 800);
        }
        catch (e) {
            wx.showToast({ title: e.message || '操作失败', icon: 'none' });
            this.setData({ submitting: false });
        }
    },
});
