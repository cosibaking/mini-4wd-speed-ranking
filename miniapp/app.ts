import { getMe } from './services/auth';
import { API_BASE } from './config';
import { setSessionUser } from './stores/session';
import type { IAppOption } from './stores/session';

type PrivacyResolve = (result: { buttonId?: string; event: 'agree' | 'disagree' }) => void;

async function restoreSession() {
  try {
    const user = await getMe();
    setSessionUser(user);
  } catch {
    setSessionUser(null);
  }
}

function initPrivacyAuthorization(app: IAppOption & { globalData: IAppOption['globalData'] }) {
  if (typeof wx.onNeedPrivacyAuthorization !== 'function') return;

  wx.onNeedPrivacyAuthorization((resolve) => {
    app.globalData.resolvePrivacyAuthorization = resolve as PrivacyResolve;
    const popup = app.globalData.privacyPopup as { show?: () => void } | null;
    if (popup?.show) {
      popup.show();
      return;
    }
    // 组件尚未挂载时，微信会降级展示官方隐私弹窗
  });
}

App({
  globalData: {
    user: null,
    apiBase: API_BASE,
    privacyPopup: null,
    resolvePrivacyAuthorization: null,
  },

  onLaunch() {
    initPrivacyAuthorization(this);
    restoreSession();
  },
});
