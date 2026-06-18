"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const community_1 = require("../../services/community");
Page({
    data: {
        users: [],
        loading: true,
    },
    async onLoad() {
        await (0, auth_1.ensureLogin)();
        this.loadFollowing();
    },
    async loadFollowing() {
        try {
            const res = await (0, community_1.listFollowing)();
            this.setData({ users: res.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
        }
    },
    onGoCommunity() {
        wx.switchTab({ url: '/pages/community/index' });
    },
});
