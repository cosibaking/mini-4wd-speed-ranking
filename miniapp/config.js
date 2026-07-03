"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENCENT_MAP_SUBKEY = exports.MOCK_REALNAME_VERIFY = exports.MOCK_LOGIN_CODE = exports.USE_MOCK_FALLBACK = exports.CLOUD_PATH_PREFIX = exports.CLOUD_SERVICE = exports.CLOUD_ENV = exports.USE_CLOUD_CONTAINER = exports.API_BASE = exports.API_MODE = void 0;
/**
 * 接口模式开关 —— 改这一处即可在本地 / 云托管之间切换。
 *
 * - local：走 HTTP 请求 LOCAL_API_BASE，开发者工具需勾选「不校验合法域名」
 * - cloud：走 wx.cloud.callContainer，体验版/正式版免备案、免配置 request 合法域名
 */
exports.API_MODE = 'cloud';
/**
 * 本地模式 API 地址（仅 API_MODE === 'local' 时生效）。
 * 开发工具用 127.0.0.1（勿用 localhost）；真机调试改为局域网 IP，例如 http://192.168.x.x:3000/api/v1。
 */
const LOCAL_API_BASE = 'http://127.0.0.1:3000/api/v1';
exports.API_BASE = LOCAL_API_BASE;
exports.USE_CLOUD_CONTAINER = exports.API_MODE === 'cloud';
/** 微信云托管环境 ID（控制台 → 云托管 → 环境列表） */
exports.CLOUD_ENV = 'prod-d8g2d9yf964787d1c';
/** 云托管服务名称，须与控制台创建的服务名、请求头 X-WX-SERVICE 一致 */
exports.CLOUD_SERVICE = 'mini4wd-api';
/** 后端 API 路径前缀（callContainer 的 path = CLOUD_PATH_PREFIX + '/auth/login' 等） */
exports.CLOUD_PATH_PREFIX = '/api/v1';
/** 开发模式：API 失败时回退 mock 数据（仅 local 模式启用） */
exports.USE_MOCK_FALLBACK = exports.API_MODE === 'local';
/**
 * 开发模式：固定微信登录 code，对应 openId = mock_{code}。
 * 须与服务端 MOCK_LOGIN_CODE、ADMIN_OPEN_IDS 配合；留空则走真实 wx.login。
 * 本地开发配合服务端 WECHAT_MOCK=true、MOCK_LOGIN_CODE=admin。
 */
exports.MOCK_LOGIN_CODE = exports.API_MODE === 'local' ? 'admin' : '';
/**
 * 开发模式：跳过微信城市服务实名校验跳转，本地模拟校验流程。
 * 须与服务端 WECHAT_REALNAME_MOCK 保持一致；也可通过 GET /config/client 动态同步。
 */
exports.MOCK_REALNAME_VERIFY = exports.API_MODE === 'local';
/**
 * 腾讯位置服务 Key，传入 map 组件 subkey。
 * 在 https://lbs.qq.com 控制台申请，需绑定当前小程序 AppID。
 */
exports.TENCENT_MAP_SUBKEY = 'BNYBZ-JRN6M-C656G-6JSNX-NMX6J-F5B24';
