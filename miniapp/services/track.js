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
/** 统一服务端列表字段，兼容 address / distanceMeters */
function normalizeTrackListItem(raw) {
    var _a, _b, _c, _d, _e, _f, _g;
    const address = (_c = (_a = raw.address) !== null && _a !== void 0 ? _a : (_b = raw.location) === null || _b === void 0 ? void 0 : _b.address) !== null && _c !== void 0 ? _c : '';
    const distance = (_d = raw.distance) !== null && _d !== void 0 ? _d : (raw.distanceMeters != null ? raw.distanceMeters : undefined);
    return {
        id: raw.id,
        name: raw.name,
        address,
        location: (_e = raw.location) !== null && _e !== void 0 ? _e : { lat: 0, lng: 0, address },
        organizerName: (_f = raw.organizerName) !== null && _f !== void 0 ? _f : '',
        distance,
        topRecord: raw.topRecord,
        participantCount: (_g = raw.participantCount) !== null && _g !== void 0 ? _g : 0,
    };
}
function normalizeTrackList(items) {
    return items.map(normalizeTrackListItem);
}
async function listTracks(query = {}) {
    const params = {};
    if (query.page)
        params.page = query.page;
    if (query.pageSize)
        params.pageSize = query.pageSize;
    if (query.keyword)
        params.keyword = query.keyword;
    if (query.lat !== undefined)
        params.lat = query.lat;
    if (query.lng !== undefined)
        params.lng = query.lng;
    if (query.sort)
        params.sort = query.sort;
    try {
        const res = await (0, http_1.request)('/tracks', {
            data: params,
            auth: false,
        });
        return { ...res, list: normalizeTrackList(res.list) };
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
    return (0, http_1.request)('/tracks/recent').then(normalizeTrackList);
}
function getMyTracks(query = {}) {
    return (0, http_1.request)('/tracks/mine', { data: query });
}
function createTrack(data) {
    return (0, http_1.request)('/tracks/create', { method: 'POST', data });
}
function updateTrack(id, data) {
    return (0, http_1.request)(`/tracks/${id}/update`, { method: 'POST', data });
}
function touchRecentVisit(trackId) {
    return (0, http_1.request)(`/tracks/${trackId}/visit`, { method: 'POST' }).catch(() => undefined);
}
