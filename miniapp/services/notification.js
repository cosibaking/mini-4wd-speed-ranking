"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TYPE_LABEL = void 0;
exports.getNotifications = getNotifications;
exports.getNotification = getNotification;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const http_1 = require("./http");
function getNotifications(query = {}) {
    const params = {};
    if (query.page)
        params.page = query.page;
    if (query.pageSize)
        params.pageSize = query.pageSize;
    if (query.unreadOnly)
        params.unreadOnly = '1';
    const qs = Object.keys(params).length
        ? `?${Object.entries(params)
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&')}`
        : '';
    return (0, http_1.request)(`/notifications${qs}`);
}
function getNotification(id) {
    return (0, http_1.request)(`/notifications/${id}`);
}
function getUnreadNotificationCount() {
    return (0, http_1.request)('/notifications/unread-count');
}
function markNotificationRead(id) {
    return (0, http_1.request)(`/notifications/${id}/read`, { method: 'POST' });
}
function markAllNotificationsRead() {
    return (0, http_1.request)('/notifications/read-all', { method: 'POST' });
}
exports.NOTIFICATION_TYPE_LABEL = {
    record_approved: '成绩',
    record_rejected: '成绩',
    record_pending_review: '审核',
    organizer_approved: '主理人',
    organizer_rejected: '主理人',
    post_liked: '点赞',
    comment_liked: '点赞',
    post_commented: '评论',
    comment_replied: '回复',
    system: '系统',
};
