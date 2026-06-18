"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const record_1 = require("../../services/record");
Page({
    data: {
        record: null,
        loading: true,
    },
    onLoad(options) {
        if (options.id)
            this.loadRecord(options.id);
    },
    async loadRecord(id) {
        try {
            const record = await (0, record_1.getRecord)(id);
            this.setData({ record, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
});
