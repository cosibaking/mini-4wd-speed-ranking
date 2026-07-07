"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const community_1 = require("../../services/community");
const mediaUrl_1 = require("../../utils/mediaUrl");
Page({
    _skipNextTabRefresh: false,
    data: {
        boards: [],
        activeBoardId: '',
        posts: [],
        sort: 'latest',
        loading: true,
        hasMore: false,
        page: 1,
    },
    onLoad() {
        this._skipNextTabRefresh = true;
        this.init();
    },
    async init() {
        var _a;
        try {
            const boards = await (0, community_1.listBoards)();
            const activeBoardId = ((_a = boards[0]) === null || _a === void 0 ? void 0 : _a.id) || '';
            this.setData({ boards, activeBoardId });
            if (activeBoardId)
                await this.loadPosts(true);
            else
                this.setData({ loading: false });
        }
        catch (_b) {
            this.setData({ loading: false });
        }
    },
    async loadPosts(reset = false) {
        const boardId = this.data.activeBoardId;
        if (!boardId) {
            this.setData({ loading: false, posts: reset ? [] : this.data.posts });
            return;
        }
        const page = reset ? 1 : this.data.page;
        this.setData({ loading: true });
        try {
            const res = await (0, community_1.listPosts)({
                boardId,
                sort: this.data.sort,
                page,
                pageSize: 20,
            });
            const resolvedList = await Promise.all(res.list.map(async (item) => {
                if (!item.coverImage)
                    return item;
                return {
                    ...item,
                    coverImage: await (0, mediaUrl_1.resolveDisplayImageUrl)(item.coverImage),
                };
            }));
            const posts = reset ? resolvedList : [...this.data.posts, ...resolvedList];
            this.setData({
                posts,
                hasMore: res.hasMore,
                page: page + 1,
                loading: false,
            });
        }
        catch (_a) {
            this.setData({ loading: false });
        }
    },
    onBoardTap(e) {
        const id = e.currentTarget.dataset.id;
        if (!id)
            return;
        this.setData({ activeBoardId: id }, () => this.loadPosts(true));
    },
    onSortTap(e) {
        const sort = e.currentTarget.dataset.sort;
        this.setData({ sort }, () => this.loadPosts(true));
    },
    onCreatePost() {
        wx.navigateTo({ url: '/pages/community/create' });
    },
    onReachBottom() {
        if (this.data.hasMore && !this.data.loading) {
            this.loadPosts(false);
        }
    },
    async refreshPage() {
        if (this.data.activeBoardId) {
            await this.loadPosts(true);
        }
        else {
            await this.init();
        }
    },
    onTabItemTap() {
        if (this._skipNextTabRefresh) {
            this._skipNextTabRefresh = false;
            return;
        }
        void this.refreshPage();
    },
    async onPullDownRefresh() {
        try {
            await this.refreshPage();
        }
        finally {
            wx.stopPullDownRefresh();
        }
    },
});
