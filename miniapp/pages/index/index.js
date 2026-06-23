"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const track_1 = require("../../services/track");
const auth_1 = require("../../services/auth");
const nav_1 = require("../../utils/nav");
const session_1 = require("../../stores/session");
Page({
    data: {
        recentTracks: [],
        loading: true,
        topPadding: 0,
        showAdminEntry: false,
    },
    onLoad() {
        const sys = wx.getSystemInfoSync();
        const menu = wx.getMenuButtonBoundingClientRect();
        const navBarHeight = (menu.top - sys.statusBarHeight) * 2 + menu.height;
        this.setData({ topPadding: sys.statusBarHeight + navBarHeight });
    },
    onShow() {
        this.refreshAdminEntry();
        this.loadRecent();
    },
    async refreshAdminEntry() {
        const user = await (0, auth_1.refreshUser)();
        this.setData({ showAdminEntry: !!(user === null || user === void 0 ? void 0 : user.isAdmin) });
    },
    async loadRecent() {
        this.setData({ loading: true });
        try {
            let recent = [];
            try {
                recent = await (0, track_1.getRecentTracks)();
            }
            catch (_a) {
                // 未登录或最近访问接口不可用时忽略
            }
            if (recent.length === 0) {
                const res = await (0, track_1.listTracks)({ pageSize: 3 });
                recent = res.list.slice(0, 3);
            }
            this.setData({ recentTracks: recent, loading: false });
        }
        catch (_b) {
            this.setData({ loading: false });
        }
    },
    async onOrganizerTap() {
        if (!(0, session_1.getSessionUser)()) {
            const ok = await (0, nav_1.navigateWithLogin)('/pages/organizer/apply');
            if (!ok)
                return;
        }
        wx.showLoading({ title: '加载中', mask: true });
        try {
            const user = await (0, auth_1.ensureLogin)();
            (0, session_1.setSessionUser)(user);
            if (user.isOrganizer) {
                wx.navigateTo({ url: '/pages/user/tracks' });
                return;
            }
            if (user.organizerApplication) {
                wx.navigateTo({ url: '/pages/organizer/status' });
                return;
            }
            wx.navigateTo({ url: '/pages/organizer/apply' });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '加载失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    onDriverTap() {
        (0, nav_1.navigateWithLogin)('/pages/track/list');
    },
    onAdminTap() {
        wx.navigateTo({ url: '/admin/pages/index/index' });
    },
    onTabItemTap(e) {
        if (e.pagePath === 'pages/index/index')
            return;
        (0, nav_1.ensureLoginForTab)();
    },
});
