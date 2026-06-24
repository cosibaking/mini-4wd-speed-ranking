"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const community_1 = require("../../services/community");
const media_1 = require("../../services/media");
const mediaUrl_1 = require("../../utils/mediaUrl");
function updateCommentLike(comments, id, liked, likeCount) {
    return comments.map((item) => item.id === id ? { ...item, liked, likeCount } : item);
}
async function withCommentDisplayImages(comments, force = false) {
    return Promise.all(comments.map(async (comment) => {
        const imageUrls = (0, mediaUrl_1.normalizeUrlList)(comment.imageUrls ?? comment.images);
        return {
            ...comment,
            imageUrls,
            images: await (0, mediaUrl_1.resolveDisplayImageUrls)(imageUrls, force),
        };
    }));
}
Page({
    data: {
        post: null,
        comments: [],
        commentText: '',
        commentImages: [],
        commentImagePreviews: [],
        replyTo: null,
        loading: true,
    },
    _pendingCommentImageRefresh: false,
    onLoad(options) {
        if (options.id)
            this.loadPost(options.id);
    },
    onShow() {
        if (this._pendingCommentImageRefresh) {
            this._pendingCommentImageRefresh = false;
            void this.refreshImagePaths();
        }
    },
    async loadPost(id) {
        let post = null;
        let comments = [];
        try {
            post = await (0, community_1.getPost)(id);
        }
        catch (_a) {
            // 帖子加载失败时仍尝试加载评论
        }
        try {
            const commentRes = await (0, community_1.listComments)(id);
            comments = commentRes.list;
        }
        catch (_b) {
            // 评论加载失败不影响帖子展示
        }
        if (post) {
            post = {
                ...post,
                images: await (0, mediaUrl_1.resolveDisplayImageUrls)((0, mediaUrl_1.normalizeUrlList)(post.images)),
            };
        }
        if (comments.length > 0) {
            comments = await withCommentDisplayImages(comments);
        }
        this.setData({ post, comments, loading: false });
    },
    async refreshImagePaths() {
        const updates = {};
        if (this.data.comments.length > 0) {
            updates.comments = await withCommentDisplayImages(this.data.comments, true);
        }
        if (this.data.commentImages.length > 0) {
            updates.commentImagePreviews = await (0, mediaUrl_1.resolveDisplayImageUrls)(this.data.commentImages, true);
        }
        if (Object.keys(updates).length > 0) {
            this.setData(updates);
        }
    },
    async onLike() {
        const post = this.data.post;
        if (!post)
            return;
        try {
            await (0, auth_1.ensureLogin)();
        }
        catch (_a) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        try {
            const res = await (0, community_1.toggleLike)({ type: 'post', id: post.id });
            this.setData({
                'post.liked': res.liked,
                'post.likeCount': res.likeCount,
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '操作失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
    },
    async onFollow() {
        const post = this.data.post;
        if (!post)
            return;
        try {
            await (0, auth_1.ensureLogin)();
        }
        catch (_a) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        try {
            const res = await (0, community_1.toggleFollow)(post.author.id);
            this.setData({ 'post.followingAuthor': res.following });
            wx.showToast({ title: res.following ? '已关注' : '已取消', icon: 'none' });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '操作失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
    },
    async onCommentLike(e) {
        const id = e.currentTarget.dataset.id;
        if (!id)
            return;
        try {
            await (0, auth_1.ensureLogin)();
        }
        catch (_a) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        try {
            const res = await (0, community_1.toggleLike)({ type: 'comment', id });
            this.setData({
                comments: updateCommentLike(this.data.comments, id, res.liked, res.likeCount),
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '操作失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
    },
    onCommentReply(e) {
        const id = e.currentTarget.dataset.id;
        const nickName = e.currentTarget.dataset.nickname;
        if (!id || !nickName)
            return;
        this.setData({ replyTo: { id, nickName } });
    },
    onOpenUser(e) {
        const id = e.currentTarget.dataset.id;
        if (!id)
            return;
        wx.navigateTo({ url: `/pages/user/detail?id=${id}` });
    },
    onCancelReply() {
        this.setData({ replyTo: null });
    },
    onCommentInput(e) {
        this.setData({ commentText: e.detail.value });
    },
    onPreviewPostImage(e) {
        const url = e.currentTarget.dataset.url;
        const urls = this.data.post?.images || [];
        if (!url || urls.length === 0)
            return;
        wx.previewImage({ urls, current: url });
    },
    onPreviewCommentImage(e) {
        const index = e.currentTarget.dataset.index;
        const commentId = e.currentTarget.dataset.commentId;
        const comment = this.data.comments.find((item) => item.id === commentId);
        const urls = (0, mediaUrl_1.normalizeUrlList)(comment?.imageUrls ?? comment?.images);
        if (!urls.length)
            return;
        wx.previewImage({ urls, current: urls[index] ?? urls[0] });
    },
    async onAddCommentImage() {
        if (this.data.commentImages.length >= 9) {
            wx.showToast({ title: '最多9张', icon: 'none' });
            return;
        }
        this._pendingCommentImageRefresh = true;
        try {
            wx.showLoading({ title: '上传中' });
            const urls = await (0, media_1.chooseAndUploadImage)('comment_image', 9 - this.data.commentImages.length);
            const commentImages = [...this.data.commentImages, ...urls];
            const commentImagePreviews = await (0, mediaUrl_1.resolveDisplayImageUrls)(commentImages, true);
            this.setData({ commentImages, commentImagePreviews });
            await this.refreshImagePaths();
            this._pendingCommentImageRefresh = false;
        }
        catch (err) {
            if (!(err instanceof media_1.UploadCancelledError)) {
                wx.showToast({ title: '上传失败', icon: 'none' });
            }
        }
        finally {
            wx.hideLoading();
        }
    },
    async onSendComment() {
        const text = this.data.commentText.trim();
        const images = this.data.commentImages;
        const post = this.data.post;
        const replyTo = this.data.replyTo;
        if ((!text && images.length === 0) || !post)
            return;
        try {
            await (0, auth_1.ensureLogin)();
            await (0, community_1.createComment)(post.id, {
                content: text,
                images,
                parentId: replyTo?.id,
            });
            const commentRes = await (0, community_1.listComments)(post.id);
            const comments = await withCommentDisplayImages(commentRes.list);
            this.setData({
                comments,
                commentText: '',
                commentImages: [],
                commentImagePreviews: [],
                replyTo: null,
                'post.commentCount': post.commentCount + 1,
            });
        }
        catch (_c) {
            wx.showToast({ title: '评论失败', icon: 'none' });
        }
    },
    onShare() {
        // 由 onShareAppMessage 处理
    },
    onShareAppMessage() {
        const post = this.data.post;
        return {
            title: post?.title || '社区帖子',
            path: `/pages/community/post?id=${post?.id}`,
        };
    },
});
