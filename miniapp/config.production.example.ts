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

/** 体验版/正式版走云托管 */
export const API_MODE = 'cloud' as 'local' | 'cloud';

const LOCAL_API_BASE = 'http://127.0.0.1:3000/api/v1';

export const API_BASE = LOCAL_API_BASE;

export const USE_CLOUD_CONTAINER = API_MODE === 'cloud';

export const CLOUD_ENV = 'prod-d8g2d9yf964787d1c';

export const CLOUD_SERVICE = 'mini4wd-api';

export const CLOUD_PATH_PREFIX = '/api/v1';

export const USE_MOCK_FALLBACK = false;

export const MOCK_LOGIN_CODE = '';

export const MOCK_REALNAME_VERIFY = false;

/**
 * 腾讯位置服务 Key（map 组件 subkey）
 * 在 https://lbs.qq.com 控制台申请，须绑定小程序 AppID
 */
export const TENCENT_MAP_SUBKEY = 'YOUR_TENCENT_MAP_SUBKEY';
