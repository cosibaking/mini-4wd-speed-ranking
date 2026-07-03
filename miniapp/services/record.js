"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = getLeaderboard;
exports.getRecord = getRecord;
exports.submitRecord = submitRecord;
exports.getMyRecords = getMyRecords;
exports.getTrackRecords = getTrackRecords;
exports.getTrackPendingCount = getTrackPendingCount;
exports.approveRecord = approveRecord;
exports.rejectRecord = rejectRecord;
const http_1 = require("./http");
const config_1 = require("../config");
const MOCK_LEADERBOARD = {
    trackId: 'track-1',
    trackName: '朝阳公园北广场赛道',
    total: 5,
    list: [
        { rank: 1, recordId: 'r1', userId: 'u1', nickName: '闪电小子', avatarUrl: '', lapTimeDisplay: '0:32.580' },
        { rank: 2, recordId: 'r2', userId: 'u2', nickName: '涡轮达人', avatarUrl: '', lapTimeDisplay: '0:33.010' },
        { rank: 3, recordId: 'r3', userId: 'u3', nickName: '弯道王', avatarUrl: '', lapTimeDisplay: '0:33.120' },
        { rank: 4, recordId: 'r4', userId: 'u4', nickName: '新手阿明', avatarUrl: '', lapTimeDisplay: '0:35.200' },
        { rank: 5, recordId: 'r5', userId: 'u5', nickName: '公园车手', avatarUrl: '', lapTimeDisplay: '0:36.800' },
    ],
    myRank: { rank: 8, lapTimeDisplay: '0:35.200', recordId: 'r4' },
};
async function getLeaderboard(trackId, query = {}) {
    try {
        return await (0, http_1.request)(`/leaderboards/${trackId}`, {
            data: query,
            auth: true,
        });
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        return { ...MOCK_LEADERBOARD, trackId };
    }
}
async function getRecord(id) {
    try {
        return await (0, http_1.request)(`/records/${id}`, { auth: false });
    }
    catch (e) {
        if (!config_1.USE_MOCK_FALLBACK)
            throw e;
        const entry = MOCK_LEADERBOARD.list.find((r) => r.recordId === id) || MOCK_LEADERBOARD.list[0];
        return {
            id: entry.recordId,
            trackId: MOCK_LEADERBOARD.trackId,
            trackName: MOCK_LEADERBOARD.trackName,
            user: { id: entry.userId, nickName: entry.nickName, avatarUrl: entry.avatarUrl },
            status: 'approved',
            lapTimeDisplay: entry.lapTimeDisplay,
            submittedLapTimeDisplay: entry.lapTimeDisplay,
            rank: entry.rank,
            videoUrl: '',
            carPhotoUrls: [],
            note: '示例成绩记录',
            createdAt: new Date().toISOString(),
        };
    }
}
function submitRecord(data) {
    return (0, http_1.request)('/records', { method: 'POST', data });
}
function getMyRecords(query = {}) {
    return (0, http_1.request)('/records/mine', { data: query });
}
function getTrackRecords(trackId, query = {}) {
    return (0, http_1.request)(`/tracks/${trackId}/records`, {
        data: query,
    });
}
function getTrackPendingCount(trackId) {
    return (0, http_1.request)(`/tracks/${trackId}/records/pending-count`);
}
function approveRecord(recordId, data) {
    return (0, http_1.request)(`/records/${recordId}/approve`, { method: 'POST', data });
}
function rejectRecord(recordId, data) {
    return (0, http_1.request)(`/records/${recordId}/reject`, { method: 'POST', data });
}
