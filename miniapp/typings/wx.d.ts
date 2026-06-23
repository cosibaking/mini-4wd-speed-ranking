declare function App(options: Record<string, unknown>): void;
declare function Page(options: Record<string, unknown>): void;
declare function Component(options: Record<string, unknown>): void;
declare function getApp<T = Record<string, unknown>>(): T;
declare function requirePlugin(name: string): unknown;

declare namespace WechatMiniprogram {
  type IAnyObject = Record<string, unknown>;

  interface BaseEvent {
    type: string;
    timeStamp: number;
    target: { id: string; dataset: IAnyObject };
    currentTarget: { id: string; dataset: IAnyObject };
  }

  interface TouchEvent extends BaseEvent {
    detail: { x: number; y: number };
  }

  interface Input extends BaseEvent {
    detail: { value: string };
  }

  interface PickerChange extends BaseEvent {
    detail: { value: string | number };
  }

  interface RadioGroupChange extends BaseEvent {
    detail: { value: string };
  }

  interface CustomEvent extends BaseEvent {
    detail: {
      value?: string;
      valid?: boolean;
      [key: string]: unknown;
    };
  }

  interface MapTapEvent extends BaseEvent {
    detail: { latitude: number; longitude: number };
  }

  interface MapPoiTapEvent extends BaseEvent {
    detail: { name: string; latitude: number; longitude: number };
  }

  interface LoginSuccessCallbackResult {
    code: string;
  }

  interface UserInfo {
    nickName: string;
    avatarUrl: string;
  }

  interface ChooseMediaSuccessCallbackResult {
    tempFiles: Array<{ tempFilePath: string; size: number }>;
  }

  interface RequestOption {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  }
}

interface WxRequestOption {
  url: string;
  method?: WechatMiniprogram.RequestOption['method'];
  data?: string | Record<string, unknown> | ArrayBuffer;
  header?: Record<string, string>;
  success?: (res: { statusCode: number; data: unknown; header?: Record<string, string> }) => void;
  fail?: (err: { errMsg: string }) => void;
  complete?: () => void;
}

interface WxUploadFileOption {
  url: string;
  filePath: string;
  name: string;
  formData?: Record<string, string>;
  header?: Record<string, string>;
  success?: (res: { statusCode: number; data: string }) => void;
  fail?: (err: { errMsg: string }) => void;
}

interface WxChooseMediaOption {
  count?: number;
  mediaType?: Array<'image' | 'video' | 'mix'>;
  sourceType?: Array<'album' | 'camera'>;
  maxDuration?: number;
  success?: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => void;
  fail?: (err: { errMsg: string }) => void;
}

declare const wx: {
  request(option: WxRequestOption): void;
  uploadFile(option: WxUploadFileOption): void;
  getFileSystemManager(): {
    readFile(option: {
      filePath: string;
      success?: (res: { data: string | ArrayBuffer }) => void;
      fail?: (err: { errMsg: string }) => void;
    }): void;
    stat(option: {
      path: string;
      success?: (res: { stats: { size: number } }) => void;
      fail?: (err: { errMsg: string }) => void;
    }): void;
  };
  chooseMedia(option: WxChooseMediaOption): void;
  login(option: {
    success?: (res: WechatMiniprogram.LoginSuccessCallbackResult) => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  getUserProfile(option: {
    desc: string;
    success?: (res: { userInfo: WechatMiniprogram.UserInfo }) => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, data: unknown): void;
  removeStorageSync(key: string): void;
  navigateTo(option: {
    url: string;
    events?: Record<string, (data: unknown) => void>;
    success?: () => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  redirectTo(option: { url: string }): void;
  navigateBack(option?: { delta?: number }): void;
  switchTab(option: {
    url: string;
    success?: () => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  showToast(option: { title: string; icon?: 'success' | 'error' | 'loading' | 'none' }): void;
  showModal(option: {
    title?: string;
    content?: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    success?: (res: { confirm: boolean; cancel: boolean }) => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  showLoading(option: { title: string; mask?: boolean }): void;
  hideLoading(): void;
  showActionSheet(option: {
    itemList: string[];
    success?: (res: { tapIndex: number }) => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  navigateToMiniProgram(option: {
    appId: string;
    path?: string;
    extraData?: Record<string, unknown>;
    envVersion?: 'develop' | 'trial' | 'release';
    success?: () => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  getLocation(option: {
    type?: string;
    success?: (res: { latitude: number; longitude: number }) => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  chooseLocation(option: {
    success?: (res: {
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    }) => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
  openLocation(option: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    scale?: number;
  }): void;
  createMapContext(mapId: string, component?: unknown): MapContext;
  previewImage(option: { urls: string[]; current?: string }): void;
  stopPullDownRefresh(): void;
  setClipboardData(option: { data: string; success?: () => void }): void;
  setNavigationBarTitle(option: { title: string }): void;
  getSystemInfoSync(): {
    statusBarHeight: number;
    windowWidth: number;
    windowHeight: number;
    platform?: string;
    safeArea?: { top: number; bottom: number };
  };
  getMenuButtonBoundingClientRect(): {
    top: number;
    bottom: number;
    height: number;
    width: number;
    left: number;
    right: number;
  };
  getEnterOptionsSync(): {
    scene: number;
    referrerInfo?: {
      appId?: string;
      extraData?: Record<string, unknown>;
    };
  };
};

interface MapContext {
  openMapApp(option: {
    latitude: number;
    longitude: number;
    destination: string;
    preferApplication?: string;
    success?: () => void;
    fail?: (err: { errMsg: string }) => void;
  }): void;
}

declare function setTimeout(handler: () => void, timeout?: number): number;
