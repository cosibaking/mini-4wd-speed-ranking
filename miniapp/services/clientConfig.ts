import { MOCK_REALNAME_VERIFY } from '../config';
import { request } from './http';

export interface ClientConfig {
  realNameMock: boolean;
  wechatMock?: boolean;
  mockLoginCode?: string;
}

let cachedConfig: ClientConfig | null = null;

export async function getClientConfig(): Promise<ClientConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const config = await request<ClientConfig>('/config/client', { auth: false });
    cachedConfig = config;
    return config;
  } catch {
    cachedConfig = { realNameMock: MOCK_REALNAME_VERIFY };
    return cachedConfig;
  }
}

export function isRealNameMockEnabled(config: ClientConfig): boolean {
  return config.realNameMock || MOCK_REALNAME_VERIFY;
}
