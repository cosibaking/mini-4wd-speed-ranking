"use strict";
/** 圈速格式化与解析 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLapTime = formatLapTime;
exports.parseLapTime = parseLapTime;
exports.isValidLapTimeInput = isValidLapTimeInput;
/** 毫秒 → 展示字符串，如 32580 → "0:32.580" 或 "32.580" */
function formatLapTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    const secStr = `${seconds}.${String(millis).padStart(3, '0')}`;
    if (minutes > 0) {
        return `${minutes}:${secStr}`;
    }
    return secStr;
}
/** 解析展示字符串 → 毫秒，支持 "0:32.58" / "32.580" / "0:32.580" */
function parseLapTime(display) {
    const trimmed = display.trim();
    if (!trimmed)
        return null;
    let minutes = 0;
    let secPart = trimmed;
    if (trimmed.includes(':')) {
        const [minStr, rest] = trimmed.split(':');
        minutes = parseInt(minStr, 10);
        if (isNaN(minutes) || minutes < 0)
            return null;
        secPart = rest;
    }
    const match = secPart.match(/^(\d+)(?:\.(\d{1,3}))?$/);
    if (!match)
        return null;
    const seconds = parseInt(match[1], 10);
    const frac = (match[2] || '0').padEnd(3, '0').slice(0, 3);
    const millis = parseInt(frac, 10);
    if (isNaN(seconds) || isNaN(millis))
        return null;
    return minutes * 60000 + seconds * 1000 + millis;
}
/** 校验圈速输入格式 */
function isValidLapTimeInput(display) {
    return parseLapTime(display) !== null;
}
