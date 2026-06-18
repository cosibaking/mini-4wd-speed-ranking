import { getMe } from './services/auth';
import { API_BASE } from './config';
import { setSessionUser } from './stores/session';
import type { IAppOption } from './stores/session';

async function restoreSession() {
  try {
    const user = await getMe();
    setSessionUser(user);
  } catch {
    setSessionUser(null);
  }
}

App({
  globalData: {
    user: null,
    apiBase: API_BASE,
  },

  onLaunch() {
    restoreSession();
  },
});
