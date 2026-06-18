"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const community_1 = require("../../services/community");
const media_1 = require("../../services/media");
Page({
    data: {
        boards: [],
        boardId: '',
        title: '',
        content: '',
        images: [],
        submitting: false,
    },
    async onLoad() {
        var _a;
        await (0, auth_1.ensureLogin)();
        const boards = await (0, community_1.listBoards)();
        this.setData({ boards, boardId: ((_a = boards[0]) === null || _a === void 0 ? void 0 : _a.id) || '' });
    },
    onBoardChange(e) {
        var _a;
        const idx = Number(e.detail.value);
        this.setData({ boardId: ((_a = this.data.boards[idx]) === null || _a === void 0 ? void 0 : _a.id) || '' });
    },
    onTitleInput(e) {
        this.setData({ title: e.detail.value });
    },
    onContentInput(e) {
        this.setData({ content: e.detail.value });
    },
    async onAddImage() {
        if (this.data.images.length >= 9) {
            wx.showToast({ title: '最多9张', icon: 'none' });
            return;
        }
        try {
            wx.showLoading({ title: '上传中' });
            const urls = await (0, media_1.chooseAndUploadImage)('post_image', 9 - this.data.images.length);
            this.setData({ images: [...this.data.images, ...urls] });
        }
        catch (_a) {
            wx.showToast({ title: '上传失败', icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    async onSubmit() {
        const { boardId, title, content, images } = this.data;
        if (!boardId) {
            wx.showToast({ title: '请选择板块', icon: 'none' });
            return;
        }
        if (!title.trim()) {
            wx.showToast({ title: '请填写标题', icon: 'none' });
            return;
        }
        if (!content.trim()) {
            wx.showToast({ title: '请填写正文', icon: 'none' });
            return;
        }
        this.setData({ submitting: true });
        try {
            const post = await (0, community_1.createPost)({
                boardId,
                title: title.trim(),
                content: content.trim(),
                images,
            });
            wx.showToast({ title: '发布成功', icon: 'success' });
            setTimeout(() => {
                wx.redirectTo({ url: `/pages/community/post?id=${post.id}` });
            }, 1000);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '发布失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ submitting: false });
        }
    },
});
