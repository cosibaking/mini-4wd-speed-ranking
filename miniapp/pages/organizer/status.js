"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const organizer_1 = require("../../services/organizer");
const session_1 = require("../../stores/session");
const STATUS_MAP = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
};
Page({
    data: {
        application: null,
        statusText: '',
        isOrganizer: false,
    },
    async onLoad() {
        await (0, auth_1.ensureLogin)();
        await this.loadStatus();
    },
    async onShow() {
        await this.loadStatus();
    },
    async loadStatus() {
        var _a;
        try {
            const [user, application] = await Promise.all([(0, auth_1.getMe)(), (0, organizer_1.getMyOrganizerApplication)()]);
            (0, session_1.setSessionUser)(user);
            if (user.isOrganizer) {
                this.setData({ isOrganizer: true, application, statusText: '已通过' });
                return;
            }
            if (!application) {
                wx.redirectTo({ url: '/pages/organizer/apply' });
                return;
            }
            this.setData({
                application,
                statusText: (_a = STATUS_MAP[application.status]) !== null && _a !== void 0 ? _a : application.status,
                isOrganizer: false,
            });
        }
        catch (_b) {
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onReapply() {
        wx.redirectTo({ url: '/pages/organizer/apply' });
    },
    onGoTracks() {
        wx.redirectTo({ url: '/pages/user/tracks' });
    },
});
