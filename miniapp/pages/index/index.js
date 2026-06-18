"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const track_1 = require("../../services/track");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        recentTracks: [],
        loading: true,
        topPadding: 0,
    },
    onLoad() {
        const sys = wx.getSystemInfoSync();
        const menu = wx.getMenuButtonBoundingClientRect();
        const navBarHeight = (menu.top - sys.statusBarHeight) * 2 + menu.height;
        this.setData({ topPadding: sys.statusBarHeight + navBarHeight });
    },
    onShow() {
        this.loadRecent();
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
    onOrganizerTap() {
        (0, nav_1.navigateWithLogin)('/pages/user/tracks');
    },
    onDriverTap() {
        (0, nav_1.navigateWithLogin)('/pages/track/list');
    },
    onTabItemTap(e) {
        if (e.pagePath === 'pages/index/index')
            return;
        (0, nav_1.ensureLoginForTab)();
    },
});
