"use strict";
/**
 * 小程序生产环境配置模板
 *
 * 用法：上线前将本文件内容复制到 config.ts，并执行 npm run compile
 * 或在构建脚本中按环境替换 config.ts。
 *
 * 微信公众平台需同步配置：
 * - request 合法域名 → API 域名（不含路径）
 * - uploadFile / downloadFile 合法域名 → COS 直传域名 + CDN 域名
 * - 腾讯位置服务 subkey → 绑定当前小程序 AppID
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENCENT_MAP_SUBKEY = exports.MOCK_REALNAME_VERIFY = exports.MOCK_LOGIN_CODE = exports.USE_MOCK_FALLBACK = exports.CLOUD_PATH_PREFIX = exports.CLOUD_SERVICE = exports.CLOUD_ENV = exports.USE_CLOUD_CONTAINER = exports.API_BASE = exports.API_MODE = void 0;
/** 体验版/正式版走云托管 */
exports.API_MODE = 'cloud';
const LOCAL_API_BASE = 'http://127.0.0.1:3000/api/v1';
exports.API_BASE = LOCAL_API_BASE;
exports.USE_CLOUD_CONTAINER = exports.API_MODE === 'cloud';
exports.CLOUD_ENV = 'prod-d8g2d9yf964787d1c';
exports.CLOUD_SERVICE = 'mini4wd-api';
exports.CLOUD_PATH_PREFIX = '/api/v1';
exports.USE_MOCK_FALLBACK = false;
exports.MOCK_LOGIN_CODE = '';
exports.MOCK_REALNAME_VERIFY = false;
/**
 * 腾讯位置服务 Key（map 组件 subkey）
 * 在 https://lbs.qq.com 控制台申请，须绑定小程序 AppID
 */
exports.TENCENT_MAP_SUBKEY = 'YOUR_TENCENT_MAP_SUBKEY';
