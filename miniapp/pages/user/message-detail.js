"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const notification_1 = require("../../services/notification");
const nav_1 = require("../../utils/nav");
const TAB_INDEX_USER = 3;
function formatTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()))
        return iso;
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    const hh = `${date.getHours()}`.padStart(2, '0');
    const mm = `${date.getMinutes()}`.padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
}
Page({
    data: {
        message: null,
        loading: true,
    },
    async onLoad(options) {
        const id = options.id;
        if (!id) {
            wx.showToast({ title: '消息不存在', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 800);
            return;
        }
        if (!(await (0, nav_1.guardLogin)()))
            return;
        await (0, auth_1.requireLogin)();
        await this.loadMessage(id);
    },
    async loadMessage(id) {
        var _a;
        this.setData({ loading: true });
        try {
            const item = await (0, notification_1.getNotification)(id);
            if ((_a = item.payload) === null || _a === void 0 ? void 0 : _a.linkPath) {
                wx.redirectTo({ url: item.payload.linkPath });
                return;
            }
            if (!item.isRead) {
                try {
                    await (0, notification_1.markNotificationRead)(id);
                    const { count } = await (0, notification_1.getUnreadNotificationCount)();
                    if (count > 0) {
                        wx.setTabBarBadge({
                            index: TAB_INDEX_USER,
                            text: count > 99 ? '99+' : String(count),
                        });
                    }
                    else {
                        wx.removeTabBarBadge({ index: TAB_INDEX_USER });
                    }
                }
                catch (_b) {
                    // ignore
                }
            }
            this.setData({
                message: {
                    ...item,
                    typeLabel: notification_1.NOTIFICATION_TYPE_LABEL[item.type],
                    timeLabel: formatTime(item.createdAt),
                },
                loading: false,
            });
        }
        catch (_c) {
            this.setData({ loading: false });
            wx.showToast({ title: '消息不存在', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 800);
        }
    },
});
