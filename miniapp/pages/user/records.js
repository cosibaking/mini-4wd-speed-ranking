"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const record_1 = require("../../services/record");
const nav_1 = require("../../utils/nav");
const STATUS_LABEL = {
    pending: '审核中',
    approved: '已认证',
    rejected: '未通过',
};
Page({
    data: {
        records: [],
        loading: true,
        statusLabel: STATUS_LABEL,
    },
    async onLoad() {
        if (!(await (0, nav_1.guardLogin)()))
            return;
        await (0, auth_1.requireLogin)();
        this.loadRecords();
    },
    onShow() {
        this.loadRecords();
    },
    async loadRecords() {
        try {
            const res = await (0, record_1.getMyRecords)();
            this.setData({ records: res.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
        }
    },
    onTap(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/record/detail?id=${id}` });
    },
    onGoTracks() {
        wx.navigateTo({ url: '/pages/track/list' });
    },
});
