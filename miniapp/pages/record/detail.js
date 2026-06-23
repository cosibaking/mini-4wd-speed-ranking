"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const record_1 = require("../../services/record");
Page({
    data: {
        recordId: '',
        record: null,
        loading: true,
    },
    onLoad(options) {
        if (options.id) {
            this.setData({ recordId: options.id });
            this.loadRecord(options.id);
        }
    },
    onShow() {
        const { recordId } = this.data;
        if (recordId)
            this.loadRecord(recordId, true);
    },
    async loadRecord(id, silent = false) {
        if (!silent)
            this.setData({ loading: true });
        try {
            const record = await (0, record_1.getRecord)(id);
            this.setData({ record, loading: false });
        }
        catch (_a) {
            if (!silent) {
                this.setData({ loading: false });
                wx.showToast({ title: '加载失败', icon: 'none' });
            }
        }
    },
});
