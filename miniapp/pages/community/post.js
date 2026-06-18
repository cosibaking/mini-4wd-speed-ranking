"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const community_1 = require("../../services/community");
Page({
    data: {
        post: null,
        comments: [],
        commentText: '',
        loading: true,
    },
    onLoad(options) {
        if (options.id)
            this.loadPost(options.id);
    },
    async loadPost(id) {
        try {
            const [post, commentRes] = await Promise.all([
                (0, community_1.getPost)(id),
                (0, community_1.listComments)(id),
            ]);
            this.setData({ post, comments: commentRes.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
        }
    },
    async onLike() {
        const post = this.data.post;
        if (!post)
            return;
        try {
            await (0, auth_1.ensureLogin)();
            const res = await (0, community_1.toggleLike)({ type: 'post', id: post.id });
            this.setData({
                'post.liked': res.liked,
                'post.likeCount': res.likeCount,
            });
        }
        catch (_a) {
            wx.showToast({ title: '请先登录', icon: 'none' });
        }
    },
    async onFollow() {
        const post = this.data.post;
        if (!post)
            return;
        try {
            await (0, auth_1.ensureLogin)();
            const res = await (0, community_1.toggleFollow)(post.author.id);
            this.setData({ 'post.followingAuthor': res.following });
            wx.showToast({ title: res.following ? '已关注' : '已取消', icon: 'none' });
        }
        catch (_a) {
            wx.showToast({ title: '请先登录', icon: 'none' });
        }
    },
    onCommentInput(e) {
        this.setData({ commentText: e.detail.value });
    },
    async onSendComment() {
        const text = this.data.commentText.trim();
        const post = this.data.post;
        if (!text || !post)
            return;
        try {
            await (0, auth_1.ensureLogin)();
            const comment = await (0, community_1.createComment)(post.id, text);
            this.setData({
                comments: [...this.data.comments, comment],
                commentText: '',
                'post.commentCount': post.commentCount + 1,
            });
        }
        catch (_a) {
            wx.showToast({ title: '评论失败', icon: 'none' });
        }
    },
    onShare() {
        // 由 onShareAppMessage 处理
    },
    onShareAppMessage() {
        const post = this.data.post;
        return {
            title: (post === null || post === void 0 ? void 0 : post.title) || '社区帖子',
            path: `/pages/community/post?id=${post === null || post === void 0 ? void 0 : post.id}`,
        };
    },
});
