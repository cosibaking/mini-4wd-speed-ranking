"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const record_1 = require("../../services/record");
const STATUS_LABEL = {
    pending: '审核中',
    approved: '已通过',
    rejected: '已拒绝',
};
Page({
    data: {
        trackId: '',
        trackName: '',
        status: 'pending',
        list: [],
        loading: true,
        statusLabel: STATUS_LABEL,
    },
    async onLoad(options) {
        await (0, auth_1.ensureLogin)();
        if (!options.trackId) {
            wx.showToast({ title: '参数错误', icon: 'none' });
            return;
        }
        this.setData({
            trackId: options.trackId,
            trackName: options.trackName ? decodeURIComponent(options.trackName) : '',
        });
        this.loadRecords();
    },
    onShow() {
        if (this.data.trackId) {
            this.loadRecords();
        }
    },
    async loadRecords() {
        const { trackId, status } = this.data;
        this.setData({ loading: true });
        try {
            const query = status === 'all' ? {} : { status };
            const res = await (0, record_1.getTrackRecords)(trackId, { ...query, pageSize: 50 });
            this.setData({ list: res.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onTabChange(e) {
        const status = e.currentTarget.dataset.status;
        this.setData({ status });
        this.loadRecords();
    },
    onTap(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/organizer/review?id=${id}` });
    },
});
