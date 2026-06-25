/**
 * 小程序生产环境配置模板
 *
 * 用法：上线前将本文件内容复制到 config.ts，并执行 npm run compile:miniapp
 * 或在构建脚本中按环境替换 config.ts。
 *
 * 微信公众平台需同步配置：
 * - request 合法域名 → API 域名（不含路径）
 * - uploadFile / downloadFile 合法域名 → COS 直传域名 + CDN 域名
 * - 腾讯位置服务 subkey → 绑定当前小程序 AppID
 */

/** 已在微信公众平台配置的 HTTPS API 域名 */
export const API_BASE = 'https://api.example.com/api/v1';

/** 生产环境关闭 mock 回退 */
export const USE_MOCK_FALLBACK = false;

/** 生产环境留空，走真实 wx.login */
export const MOCK_LOGIN_CODE = '';

/** 生产环境关闭，走微信城市服务实名校验 */
export const MOCK_REALNAME_VERIFY = false;

/**
 * 腾讯位置服务 Key（map 组件 subkey）
 * 在 https://lbs.qq.com 控制台申请，须绑定小程序 AppID
 */
export const TENCENT_MAP_SUBKEY = 'YOUR_TENCENT_MAP_SUBKEY';
