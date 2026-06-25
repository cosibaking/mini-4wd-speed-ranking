"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const record_1 = require("../../services/record");
const track_1 = require("../../services/track");
const media_1 = require("../../services/media");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        trackId: '',
        track: null,
        lapTime: '',
        lapTimeValid: false,
        videoUrl: '',
        configType: 'text',
        configText: '',
        configImageUrl: '',
        carPhotoUrls: [],
        note: '',
        submitting: false,
    },
    async onLoad(options) {
        if (!(await (0, nav_1.guardLogin)('请先登录后再上传成绩')))
            return;
        await (0, auth_1.requireLogin)();
        if (options.trackId) {
            const track = await (0, track_1.getTrack)(options.trackId);
            this.setData({ trackId: options.trackId, track });
        }
    },
    onLapTimeChange(e) {
        const { value, valid } = e.detail;
        this.setData({ lapTime: value, lapTimeValid: valid });
    },
    async onUploadVideo() {
        try {
            wx.showLoading({ title: '上传中' });
            const url = await (0, media_1.chooseAndUploadVideo)('record_video');
            this.setData({ videoUrl: url });
        }
        catch (_a) {
            wx.showToast({ title: '上传失败', icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    onConfigTypeChange(e) {
        this.setData({ configType: e.detail.value });
    },
    onConfigTextInput(e) {
        this.setData({ configText: e.detail.value });
    },
    async onUploadConfigImage() {
        try {
            wx.showLoading({ title: '上传中' });
            const urls = await (0, media_1.chooseAndUploadImage)('record_config', 1);
            this.setData({ configImageUrl: urls[0] });
        }
        catch (_a) {
            wx.showToast({ title: '上传失败', icon: 'none' });
        }
        finally {
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
            const urls = await (0, media_1.chooseAndUploadImage)('record_car_photo', 3 - this.data.carPhotoUrls.length);
            this.setData({ carPhotoUrls: [...this.data.carPhotoUrls, ...urls] });
        }
        catch (_a) {
            wx.showToast({ title: '上传失败', icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    onNoteInput(e) {
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
        let configSheet;
        if (configType === 'text' && configText.trim()) {
            configSheet = { type: 'text', content: configText.trim() };
        }
        else if (configType === 'image' && configImageUrl) {
            configSheet = { type: 'image', url: configImageUrl };
        }
        this.setData({ submitting: true });
        try {
            await (0, record_1.submitRecord)({
                trackId,
                lapTimeDisplay: lapTime,
                videoUrl,
                configSheet,
                carPhotoUrls: carPhotoUrls.length ? carPhotoUrls : undefined,
                note: note.trim() || undefined,
            });
            wx.redirectTo({ url: `/pages/record/success?trackId=${trackId}` });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '提交失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ submitting: false });
        }
    },
});
