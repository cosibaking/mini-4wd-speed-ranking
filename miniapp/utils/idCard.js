"use strict";
/**
 * 中国大陆二代居民身份证（18 位）校验。
 * 微信无法向小程序提供实名姓名/身份证号，故此处按国标规则做格式与校验码校验。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIdCard = isValidIdCard;
exports.isValidPhone = isValidPhone;
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
const FORMAT_RE = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dX]$/;
/** 校验 18 位身份证号是否合法（格式 + 出生日期 + 校验码） */
function isValidIdCard(raw) {
    const id = (raw || '').trim().toUpperCase();
    if (!FORMAT_RE.test(id)) {
        return false;
    }
    // 出生日期真实性校验
    const year = Number(id.slice(6, 10));
    const month = Number(id.slice(10, 12));
    const day = Number(id.slice(12, 14));
    const birth = new Date(year, month - 1, day);
    const now = new Date();
    if (birth.getFullYear() !== year ||
        birth.getMonth() !== month - 1 ||
        birth.getDate() !== day ||
        birth.getTime() > now.getTime()) {
        return false;
    }
    // 校验码（GB 11643-1999）
    let sum = 0;
    for (let i = 0; i < 17; i += 1) {
        sum += Number(id[i]) * WEIGHTS[i];
    }
    return CHECK_CODES[sum % 11] === id[17];
}
/** 校验中国大陆手机号 */
function isValidPhone(raw) {
    return /^1[3-9]\d{9}$/.test((raw || '').trim());
}
