"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../../services/admin");
Page({
    data: {
        list: [],
        loading: true,
    },
    onLoad() {
        this.loadList();
    },
    async loadList() {
        try {
            const res = await (0, admin_1.listAdminTracks)({ pageSize: 100 });
            this.setData({ list: res.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onOpen(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/track/detail?id=${id}` });
    },
});
