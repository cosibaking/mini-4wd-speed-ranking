"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../../services/auth");
const admin_1 = require("../../../services/admin");
function filterUsersByKeyword(users, keyword) {
    const kw = keyword.trim().toLowerCase();
    if (!kw)
        return users;
    return users.filter((user) => (user.nickName || '微信用户').toLowerCase().includes(kw));
}
function buildDisplayUsers(users, keyword, selectedUserIds) {
    const selectedSet = new Set(selectedUserIds);
    return filterUsersByKeyword(users, keyword).map((user) => (Object.assign(Object.assign({}, user), { selected: selectedSet.has(user.id) })));
}
Page({
    data: {
        mode: 'single',
        title: '',
        content: '',
        users: [],
        displayUsers: [],
        selectedUserIds: [],
        selectedCount: 0,
        userSearch: '',
        userCount: 0,
        loadingUsers: true,
        submitting: false,
    },
    async onLoad(options) {
        const user = await (0, auth_1.ensureLogin)();
        if (!user.isAdmin) {
            wx.showToast({ title: '无管理权限', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 800);
            return;
        }
        await Promise.all([this.loadUsers(), this.loadUserCount()]);
        const presetUserId = options.userId;
        if (presetUserId) {
            this.setData({
                mode: 'single',
                selectedUserIds: [presetUserId],
                selectedCount: 1,
            });
            this.refreshDisplayUsers();
        }
    },
    refreshDisplayUsers() {
        const { users, userSearch, selectedUserIds } = this.data;
        this.setData({
            displayUsers: buildDisplayUsers(users, userSearch, selectedUserIds),
            selectedCount: selectedUserIds.length,
        });
    },
    async loadUsers() {
        this.setData({ loadingUsers: true });
        try {
            const res = await (0, admin_1.listAdminUsers)({ pageSize: 100 });
            this.setData({ users: res.list, loadingUsers: false });
            this.refreshDisplayUsers();
        }
        catch (_a) {
            this.setData({ loadingUsers: false });
            wx.showToast({ title: '用户列表加载失败', icon: 'none' });
        }
    },
    async loadUserCount() {
        try {
            const stats = await (0, admin_1.getAdminDashboard)();
            this.setData({ userCount: stats.userCount });
        }
        catch (_a) {
            // ignore
        }
    },
    onModeChange(e) {
        const mode = e.currentTarget.dataset.mode;
        this.setData({ mode });
    },
    onUserSearchInput(e) {
        this.setData({ userSearch: e.detail.value });
        this.refreshDisplayUsers();
    },
    onClearUserSearch() {
        this.setData({ userSearch: '' });
        this.refreshDisplayUsers();
    },
    onToggleUser(e) {
        const { id } = e.currentTarget.dataset;
        const selectedUserIds = [...this.data.selectedUserIds];
        const index = selectedUserIds.indexOf(id);
        if (index >= 0) {
            selectedUserIds.splice(index, 1);
        }
        else {
            selectedUserIds.push(id);
        }
        this.setData({ selectedUserIds });
        this.refreshDisplayUsers();
    },
    onTitleInput(e) {
        this.setData({ title: e.detail.value });
    },
    onContentInput(e) {
        this.setData({ content: e.detail.value });
    },
    onSubmit() {
        const { mode, title, content, selectedUserIds, userCount, submitting } = this.data;
        if (submitting)
            return;
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        if (!trimmedTitle) {
            wx.showToast({ title: '请填写标题', icon: 'none' });
            return;
        }
        if (!trimmedContent) {
            wx.showToast({ title: '请填写内容', icon: 'none' });
            return;
        }
        if (mode === 'single' && selectedUserIds.length === 0) {
            wx.showToast({ title: '请选择接收用户', icon: 'none' });
            return;
        }
        let confirmContent = '';
        if (mode === 'broadcast') {
            confirmContent = `确认向全部 ${userCount} 位用户发送站内信？`;
        }
        else if (selectedUserIds.length === 1) {
            const user = this.data.users.find((item) => item.id === selectedUserIds[0]);
            confirmContent = `确认向「${(user === null || user === void 0 ? void 0 : user.nickName) || '微信用户'}」发送站内信？`;
        }
        else {
            confirmContent = `确认向 ${selectedUserIds.length} 位用户发送站内信？`;
        }
        wx.showModal({
            title: mode === 'broadcast' ? '确认群发' : '确认发送',
            content: confirmContent,
            success: async (res) => {
                if (!res.confirm)
                    return;
                this.setData({ submitting: true });
                try {
                    const result = await (0, admin_1.sendAdminNotification)({
                        title: trimmedTitle,
                        content: trimmedContent,
                        userIds: mode === 'single' ? selectedUserIds : undefined,
                    });
                    wx.showToast({
                        title: mode === 'broadcast' ? `已发送 ${result.sent} 人` : `已发送 ${result.sent} 人`,
                        icon: 'success',
                    });
                    setTimeout(() => wx.navigateBack(), 800);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '发送失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
                finally {
                    this.setData({ submitting: false });
                }
            },
        });
    },
});
