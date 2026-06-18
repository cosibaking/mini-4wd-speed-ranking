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
async function listBoards() {
    try {
        return await (0, http_1.request)('/boards', { auth: false });
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        return MOCK_BOARDS;
    }
}
async function listPosts(query = {}) {
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
        return await (0, http_1.request)(`/posts/${id}`, { auth: false });
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
    return (0, http_1.request)('/posts', { method: 'POST', data });
}
async function listComments(postId, query = {}) {
    try {
        return await (0, http_1.request)(`/posts/${postId}/comments`, {
            data: query,
            auth: false,
        });
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
function createComment(postId, content) {
    return (0, http_1.request)(`/posts/${postId}/comments`, {
        method: 'POST',
        data: { content },
    });
}
function toggleLike(target) {
    return (0, http_1.request)('/social/like', { method: 'POST', data: target });
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
