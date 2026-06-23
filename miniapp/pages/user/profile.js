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
        nicknameDraft: '',
        showNicknameInput: true,
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
        this.setData({
            editingNickname: true,
            nicknameDraft: '',
            showNicknameInput: true,
        });
    },
    onNicknameInput(e) {
        const value = e.detail.value;
        this.setData({ nicknameDraft: value, nickName: value });
    },
    onNicknameChange(e) {
        const value = e.detail.value.trim();
        if (!value)
            return;
        const prev = this.data.nicknameDraft;
        if (value === prev) {
            this.setData({ nickName: value });
            return;
        }
        if (prev && value.startsWith(prev)) {
            this.setData({ nicknameDraft: value, nickName: value });
            return;
        }
        // 点击「用微信昵称」时 bindchange 会触发，重挂载输入框以刷新显示
        this.setData({ showNicknameInput: false, nicknameDraft: '' }, () => {
            this.setData({
                showNicknameInput: true,
                nicknameDraft: value,
                nickName: value,
            });
        });
    },
    onCancelNickname() {
        const user = this.data.user;
        this.setData({
            editingNickname: false,
            nickName: (user === null || user === void 0 ? void 0 : user.nickName) || '',
            nicknameDraft: '',
            showNicknameInput: true,
        });
    },
    async onSaveNickname() {
        const nickName = (this.data.nicknameDraft || this.data.nickName).trim();
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
