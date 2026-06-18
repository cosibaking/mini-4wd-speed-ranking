"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const media_1 = require("../../services/media");
const session_1 = require("../../stores/session");
Page({
    data: {
        user: null,
        nickName: '',
        avatarUrl: '',
        editingNickname: false,
        saving: false,
    },
    async onLoad() {
        const user = await (0, auth_1.ensureLogin)();
        this.setData({
            user,
            nickName: user.nickName || '',
            avatarUrl: user.avatarUrl || '',
        });
    },
    onEditAvatar() {
        wx.showModal({
            title: '修改头像',
            content: '是否使用微信头像？',
            confirmText: '使用',
            cancelText: '自定义',
            success: (res) => {
                if (res.confirm) {
                    this.useWeChatAvatar();
                }
                else if (res.cancel) {
                    this.chooseCustomAvatar();
                }
            },
        });
    },
    async useWeChatAvatar() {
        try {
            const profile = await (0, auth_1.getUserProfile)();
            await this.saveProfile({ avatarUrl: profile.avatarUrl });
        }
        catch (_a) {
            wx.showToast({ title: '获取微信头像失败', icon: 'none' });
        }
    },
    async chooseCustomAvatar() {
        try {
            const [url] = await (0, media_1.chooseAndUploadImage)('post_image', 1);
            await this.saveProfile({ avatarUrl: url });
        }
        catch (_a) {
            // 用户取消选择时不提示
        }
    },
    onEditNickname() {
        if (this.data.editingNickname)
            return;
        wx.showModal({
            title: '修改昵称',
            content: '是否使用微信昵称？',
            confirmText: '使用',
            cancelText: '自定义',
            success: (res) => {
                if (res.confirm) {
                    this.useWeChatNickname();
                }
                else if (res.cancel) {
                    this.setData({ editingNickname: true });
                }
            },
        });
    },
    async useWeChatNickname() {
        try {
            const profile = await (0, auth_1.getUserProfile)();
            await this.saveProfile({ nickName: profile.nickName });
        }
        catch (_a) {
            wx.showToast({ title: '获取微信昵称失败', icon: 'none' });
        }
    },
    onNicknameInput(e) {
        this.setData({ nickName: e.detail.value });
    },
    onCancelNickname() {
        const user = this.data.user;
        this.setData({
            editingNickname: false,
            nickName: (user === null || user === void 0 ? void 0 : user.nickName) || '',
        });
    },
    async onSaveNickname() {
        const nickName = this.data.nickName.trim();
        if (!nickName) {
            wx.showToast({ title: '昵称不能为空', icon: 'none' });
            return;
        }
        await this.saveProfile({ nickName });
        this.setData({ editingNickname: false });
    },
    async saveProfile(data) {
        if (this.data.saving)
            return;
        this.setData({ saving: true });
        try {
            const updated = await (0, auth_1.updateMe)(data);
            (0, session_1.setSessionUser)(updated);
            this.setData({
                user: updated,
                nickName: updated.nickName,
                avatarUrl: updated.avatarUrl,
                saving: false,
            });
            wx.showToast({ title: '保存成功', icon: 'success' });
        }
        catch (_a) {
            this.setData({ saving: false });
            wx.showToast({ title: '保存失败', icon: 'none' });
        }
    },
});
