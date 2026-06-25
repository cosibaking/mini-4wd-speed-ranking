"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLoginCode = resolveLoginCode;
/** 获取微信原生登录 code（始终调用 wx.login，不使用 mock） */
async function resolveLoginCode() {
    const { code } = await new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }));
    if (!code || !code.trim()) {
        throw new Error('微信登录失败，请重试');
    }
    return code;
}
