"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBoards = listBoards;
exports.listPosts = listPosts;
exports.getPost = getPost;
exports.createPost = createPost;
exports.listComments = listComments;
exports.createComment = createComment;
exports.toggleLike = toggleLike;
exports.toggleFollow = toggleFollow;
exports.listFollowing = listFollowing;
exports.listFollowingPosts = listFollowingPosts;
const http_1 = require("./http");
const config_1 = require("../config");
const mediaUrl_1 = require("../utils/mediaUrl");
const MOCK_BOARDS = [
    { id: 'b1', name: '赛道/赛事专区', description: '赛道活动、赛事通知' },
    { id: 'b2', name: '新手入门区', description: '入门教程、规则科普' },
    { id: 'b3', name: '车手交流区', description: '改装、手感、闲聊' },
    { id: 'b4', name: '新品发布区', description: '装备新品、开箱' },
];
const MOCK_POSTS = [
    {
        id: 'p1',
        boardId: 'b1',
        title: '周末朝阳公园交流赛报名',
        summary: '本周六上午9点，欢迎车友带车来刷圈…',
        author: { id: 'u1', nickName: '阿速', avatarUrl: '' },
        likeCount: 12,
        commentCount: 5,
        createdAt: '2026-06-17T10:00:00Z',
    },
    {
        id: 'p2',
        boardId: 'b3',
        title: '这款马达怎么配齿轮比？',
        summary: '刚入手高速马达，求大佬指点…',
        author: { id: 'u2', nickName: '涡轮达人', avatarUrl: '' },
        likeCount: 8,
        commentCount: 15,
        createdAt: '2026-06-16T14:30:00Z',
    },
];
function normalizePostDetail(raw) {
    var _a, _b;
    const imageUrls = (0, mediaUrl_1.normalizeUrlList)((_a = raw.imageUrls) !== null && _a !== void 0 ? _a : raw.images);
    const followingAuthor = (_b = raw.followingAuthor) !== null && _b !== void 0 ? _b : raw.authorFollowed !== null && raw.authorFollowed !== void 0 ? raw.authorFollowed : false;
    return {
        ...raw,
        images: imageUrls,
        followingAuthor,
    };
}
function flattenComments(list) {
    const flat = [];
    for (const item of list) {
        const { replies, ...rest } = item;
        flat.push(rest);
        if (replies === null || replies === void 0 ? void 0 : replies.length) {
            flat.push(...flattenComments(replies));
        }
    }
    return flat;
}
function normalizeComment(raw) {
    var _a, _b, _c, _d, _e, _f;
    const imageUrls = (0, mediaUrl_1.normalizeUrlList)((_a = raw.imageUrls) !== null && _a !== void 0 ? _a : raw.images);
    const repliesRaw = (_c = raw.replies) !== null && _c !== void 0 ? _c : [];
    const author = (_d = raw.author) !== null && _d !== void 0 ? _d : { id: '', nickName: '用户', avatarUrl: '' };
    return {
        id: String((_e = raw.id) !== null && _e !== void 0 ? _e : ''),
        author,
        content: String((_f = raw.content) !== null && _f !== void 0 ? _f : ''),
        images: imageUrls,
        imageUrls,
        likeCount: Number(raw.likeCount !== null && raw.likeCount !== void 0 ? raw.likeCount : 0),
        liked: raw.liked,
        createdAt: String(raw.createdAt !== null && raw.createdAt !== void 0 ? raw.createdAt : ''),
        parentId: raw.parentId ? String(raw.parentId) : undefined,
        replyTo: raw.replyTo,
        replies: repliesRaw.map(normalizeComment),
    };
}
async function listBoards() {
    var _a;
    try {
        const res = await (0, http_1.request)('/boards', { auth: false });
        return Array.isArray(res) ? res : ((_a = res.list) !== null && _a !== void 0 ? _a : []);
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        return MOCK_BOARDS;
    }
}
async function listPosts(query = {}) {
    if (!query.boardId) {
        return {
            list: [],
            total: 0,
            page: query.page || 1,
            pageSize: query.pageSize || 20,
            hasMore: false,
        };
    }
    try {
        return await (0, http_1.request)('/posts', { data: query, auth: false });
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        let list = [...MOCK_POSTS];
        if (query.boardId)
            list = list.filter((p) => p.boardId === query.boardId);
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        return {
            list,
            total: list.length,
            page,
            pageSize,
            hasMore: false,
        };
    }
}
async function getPost(id) {
    try {
        const raw = await (0, http_1.request)(`/posts/${id}`, { auth: false });
        return normalizePostDetail(raw);
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        const item = MOCK_POSTS.find((p) => p.id === id) || MOCK_POSTS[0];
        return {
            ...item,
            content: item.summary + '\n\n欢迎车友交流讨论，分享你的改装心得。',
            images: [],
            liked: false,
            followingAuthor: false,
        };
    }
}
function createPost(data) {
    var _a;
    const { images, imageUrls, ...rest } = data;
    return (0, http_1.request)('/posts', {
        method: 'POST',
        data: { ...rest, imageUrls: (_a = imageUrls !== null && imageUrls !== void 0 ? imageUrls : images) !== null && _a !== void 0 ? _a : [] },
    }).then(normalizePostDetail);
}
async function listComments(postId, query = { page: 1, pageSize: 100 }) {
    var _a;
    try {
        const res = await (0, http_1.request)(`/posts/${postId}/comments`, {
            data: { page: (_a = query.page) !== null && _a !== void 0 ? _a : 1, pageSize: query.pageSize !== null && query.pageSize !== void 0 ? query.pageSize : 100 },
            auth: false,
        });
        const normalized = (res.list !== null && res.list !== void 0 ? res.list : []).map(normalizeComment);
        return {
            ...res,
            list: flattenComments(normalized),
        };
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        return {
            list: [
                {
                    id: 'c1',
                    author: { id: 'u3', nickName: '弯道王', avatarUrl: '' },
                    content: '说得对，周末见！',
                    images: [],
                    likeCount: 2,
                    createdAt: '2026-06-17T11:00:00Z',
                },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
            hasMore: false,
        };
    }
}
function createComment(postId, data) {
    var _a;
    return (0, http_1.request)(`/posts/${postId}/comments`, {
        method: 'POST',
        data: {
            content: data.content,
            imageUrls: (_a = data.images) !== null && _a !== void 0 ? _a : [],
            ...(data.parentId ? { parentId: data.parentId } : {}),
        },
    }).then(normalizeComment);
}
function toggleLike(target) {
    return (0, http_1.request)('/social/like', {
        method: 'POST',
        data: { targetType: target.type, targetId: target.id },
    });
}
function toggleFollow(followeeId) {
    return (0, http_1.request)('/social/follow', { method: 'POST', data: { followeeId } });
}
function listFollowing(query = {}) {
    return (0, http_1.request)('/social/following', { data: query });
}
function listFollowingPosts(query = {}) {
    return (0, http_1.request)('/posts/following', { data: query });
}
