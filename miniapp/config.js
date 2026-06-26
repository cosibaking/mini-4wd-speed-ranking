"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENCENT_MAP_SUBKEY = exports.MOCK_REALNAME_VERIFY = exports.MOCK_LOGIN_CODE = exports.USE_MOCK_FALLBACK = exports.API_BASE = void 0;
/**
 * API 基础地址。
 * 本地开发请用 127.0.0.1（勿用 localhost），并在 project.config.json 保持 urlCheck: false。
 * 真机调试时改为本机局域网 IP，例如 http://192.168.x.x:3000/api/v1。
 * 上线前改为已在微信公众平台配置的 HTTPS 域名。
 */
// export const API_BASE = 'http://127.0.0.1:3000/api/v1';
// export const API_BASE = 'http://192.168.10.27:3000/api/v1';
exports.API_BASE = 'http://82.156.54.232:3001/api/v1';
/** 开发模式：API 失败时回退 mock 数据 */
exports.USE_MOCK_FALLBACK = true;
/** @deprecated 已废弃，登录始终走 wx.login */
exports.MOCK_LOGIN_CODE = '';
/**
 * 开发模式：跳过微信城市服务实名校验跳转，本地模拟校验流程。
 * 须与服务端 WECHAT_REALNAME_MOCK 保持一致；也可通过 GET /config/client 动态同步。
 */
exports.MOCK_REALNAME_VERIFY = true;
/**
 * 腾讯位置服务 Key，传入 map 组件 subkey。
 * 在 https://lbs.qq.com 控制台申请，需绑定当前小程序 AppID。
 */
exports.TENCENT_MAP_SUBKEY = 'BNYBZ-JRN6M-C656G-6JSNX-NMX6J-F5B24';
