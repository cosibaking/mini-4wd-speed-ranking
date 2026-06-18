"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Component({
    properties: {
        entry: {
            type: Object,
            value: {},
        },
        highlight: {
            type: Boolean,
            value: false,
        },
    },
    methods: {
        onTap() {
            const entry = this.properties.entry;
            if (entry === null || entry === void 0 ? void 0 : entry.recordId) {
                wx.navigateTo({ url: `/pages/record/detail?id=${entry.recordId}` });
            }
        },
    },
});
