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
    data: {
        avatarError: false,
    },
    methods: {
        onTap() {
            const entry = this.properties.entry;
            if (entry === null || entry === void 0 ? void 0 : entry.recordId) {
                wx.navigateTo({ url: `/pages/record/detail?id=${entry.recordId}` });
            }
        },
        // 头像加载失败（如网络异常/限流）时回退到默认头像
        onAvatarError() {
            if (!this.data.avatarError) {
                this.setData({ avatarError: true });
            }
        },
    },
});
