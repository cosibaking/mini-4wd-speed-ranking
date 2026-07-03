/**
 * API 基础地址。
 * 本地开发请用 127.0.0.1（勿用 localhost），并在 project.config.json 保持 urlCheck: false。
 * 真机调试时改为本机局域网 IP，例如 http://192.168.x.x:3000/api/v1。
 * 上线前改为已在微信公众平台配置的 HTTPS 域名。
 */
// 本地开发（后端跑在本机）：'http://127.0.0.1:3000/api/v1'
// 82 测试服务器：后端 systemd 托管监听 3001，经 nginx 反代 /mini4wd/ → 3001（走 80 端口）
export const API_BASE = 'http://82.156.54.232/mini4wd/api/v1';

/**
 * 体验版/正式版走微信云托管（免备案、免配置 request 合法域名）。
 * 本地开发时在开发者工具勾选「不校验合法域名」并设为 false。
 */
export const USE_CLOUD_CONTAINER = true;

/** 微信云托管环境 ID（控制台 → 云托管 → 环境列表） */
export const CLOUD_ENV = 'prod-d8g2d9yf964787d1c';

/** 云托管服务名称，须与控制台创建的服务名、请求头 X-WX-SERVICE 一致 */
export const CLOUD_SERVICE = 'mini4wd-api';

/** 后端 API 路径前缀（callContainer 的 path = CLOUD_PATH_PREFIX + '/auth/login' 等） */
export const CLOUD_PATH_PREFIX = '/api/v1';

/** 开发模式：API 失败时回退 mock 数据 */
export const USE_MOCK_FALLBACK = true;

/**
 * 开发模式：固定微信登录 code，对应 openId = mock_{code}。
 * 须与服务端 MOCK_LOGIN_CODE、ADMIN_OPEN_IDS 配合；留空则走真实 wx.login。
 * 82 后端使用真实微信登录（WECHAT_MOCK=false），故此处留空。
 */
export const MOCK_LOGIN_CODE = '';

/**
 * 开发模式：跳过微信城市服务实名校验跳转，本地模拟校验流程。
 * 须与服务端 WECHAT_REALNAME_MOCK 保持一致；也可通过 GET /config/client 动态同步。
 */
export const MOCK_REALNAME_VERIFY = true;

/**
 * 腾讯位置服务 Key，传入 map 组件 subkey。
 * 在 https://lbs.qq.com 控制台申请，需绑定当前小程序 AppID。
 */
export const TENCENT_MAP_SUBKEY = 'BNYBZ-JRN6M-C656G-6JSNX-NMX6J-F5B24';
