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
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 60000)
        return '刚刚';
    if (diff < 3600000)
        return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000)
        return `${Math.floor(diff / 3600000)} 小时前`;
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    const hh = `${date.getHours()}`.padStart(2, '0');
    const mm = `${date.getMinutes()}`.padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
}
Page({
    data: {
        messages: [],
        loading: true,
        hasMore: false,
        page: 1,
        markingAll: false,
    },
    async onLoad() {
        if (!(await (0, nav_1.guardLogin)()))
            return;
        await (0, auth_1.requireLogin)();
        this.loadMessages(true);
    },
    async onShow() {
        await this.loadMessages(true);
    },
    async loadMessages(reset = false) {
        const page = reset ? 1 : this.data.page;
        this.setData({ loading: true });
        try {
            const res = await (0, notification_1.getNotifications)({ page, pageSize: 20 });
            const mapped = res.list.map((item) => ({
                ...item,
                typeLabel: notification_1.NOTIFICATION_TYPE_LABEL[item.type],
                timeLabel: formatTime(item.createdAt),
            }));
            this.setData({
                messages: reset ? mapped : [...this.data.messages, ...mapped],
                page: page + 1,
                hasMore: res.hasMore,
                loading: false,
            });
        }
        catch (_a) {
            this.setData({ loading: false });
        }
    },
    onReachBottom() {
        if (this.data.hasMore && !this.data.loading) {
            this.loadMessages(false);
        }
    },
    async onMarkAllRead() {
        if (this.data.markingAll)
            return;
        this.setData({ markingAll: true });
        try {
            await (0, notification_1.markAllNotificationsRead)();
            wx.removeTabBarBadge({ index: TAB_INDEX_USER });
            await this.loadMessages(true);
        }
        catch (_a) {
            wx.showToast({ title: '操作失败', icon: 'none' });
        }
        finally {
            this.setData({ markingAll: false });
        }
    },
    async onTap(e) {
        const id = e.currentTarget.dataset.id;
        const linkPath = e.currentTarget.dataset.link;
        const item = this.data.messages.find((msg) => msg.id === id);
        if (!item)
            return;
        if (!item.isRead) {
            try {
                await (0, notification_1.markNotificationRead)(id);
                const messages = this.data.messages.map((msg) => msg.id === id ? { ...msg, isRead: true } : msg);
                this.setData({ messages });
            }
            catch (_a) {
                // ignore
            }
        }
        if (linkPath) {
            wx.navigateTo({ url: linkPath });
        }
        else {
            wx.navigateTo({ url: `/pages/user/message-detail?id=${id}` });
        }
    },
});
