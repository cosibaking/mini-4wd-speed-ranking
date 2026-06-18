"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTracks = listTracks;
exports.getTrack = getTrack;
exports.getRecentTracks = getRecentTracks;
exports.getMyTracks = getMyTracks;
exports.createTrack = createTrack;
exports.updateTrack = updateTrack;
exports.touchRecentVisit = touchRecentVisit;
const http_1 = require("./http");
const config_1 = require("../config");
const MOCK_TRACKS = [
    {
        id: 'track-1',
        name: '朝阳公园北广场赛道',
        location: { lat: 39.9321, lng: 116.4547, address: '北京市朝阳区朝阳公园北路' },
        organizerName: '阿速',
        distance: 1200,
        topRecord: { nickName: '闪电小子', lapTimeDisplay: '0:32.580' },
        participantCount: 18,
    },
    {
        id: 'track-2',
        name: '奥森南园迷你赛道',
        location: { lat: 40.0089, lng: 116.3974, address: '北京市朝阳区奥林匹克森林公园' },
        organizerName: '四驱老王',
        distance: 3500,
        topRecord: { nickName: '涡轮达人', lapTimeDisplay: '0:28.120' },
        participantCount: 42,
    },
];
function mockPaginate(list, query = {}) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const slice = list.slice(start, start + pageSize);
    return {
        list: slice,
        total: list.length,
        page,
        pageSize,
        hasMore: start + pageSize < list.length,
    };
}
async function listTracks(query = {}) {
    try {
        return await (0, http_1.request)('/tracks', { data: query, auth: false });
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        let list = [...MOCK_TRACKS];
        if (query.keyword) {
            list = list.filter((t) => t.name.includes(query.keyword));
        }
        return mockPaginate(list, query);
    }
}
async function getTrack(id) {
    try {
        return await (0, http_1.request)(`/tracks/${id}`, { auth: false });
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        const item = MOCK_TRACKS.find((t) => t.id === id) || MOCK_TRACKS[0];
        return {
            id: item.id,
            name: item.name,
            location: item.location,
            organizerName: item.organizerName,
            organizerContact: 'wxid_demo',
            lengthMeters: 120,
            floorPlanUrls: [],
            exampleVideoUrl: '',
            ruleNote: '从起跑线到终点线，视频需连续无剪辑。',
            creatorId: 'user-demo',
            recordCount: item.participantCount,
            leaderboardSummary: {
                topRecord: item.topRecord
                    ? { userId: 'u1', nickName: item.topRecord.nickName, lapTimeDisplay: item.topRecord.lapTimeDisplay }
                    : undefined,
                participantCount: item.participantCount,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
}
function getRecentTracks() {
    return (0, http_1.request)('/tracks/recent');
}
function getMyTracks(query = {}) {
    return (0, http_1.request)('/tracks/mine', { data: query });
}
function createTrack(data) {
    return (0, http_1.request)('/tracks', { method: 'POST', data });
}
function updateTrack(id, data) {
    return (0, http_1.request)(`/tracks/${id}`, { method: 'PATCH', data });
}
function touchRecentVisit(trackId) {
    return (0, http_1.request)(`/tracks/${trackId}/visit`, { method: 'POST' }).catch(() => undefined);
}
