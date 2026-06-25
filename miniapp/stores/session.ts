import type { UserProfile } from '../types';

let sessionUser: UserProfile | null = null;

export function getSessionUser(): UserProfile | null {
  return sessionUser;
}

export function setSessionUser(user: UserProfile | null): void {
  sessionUser = user;
  const app = getApp<IAppOption>();
  if (app) app.globalData.user = user;
}

export interface IAppOption {
  globalData: {
    user: UserProfile | null;
    apiBase: string;
    privacyPopup: { show?: () => void; hide?: () => void } | null;
    resolvePrivacyAuthorization:
      | ((result: { buttonId?: string; event: 'agree' | 'disagree' }) => void)
      | null;
  };
}
