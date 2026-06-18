/** 当前请求用户上下文，由鉴权中间件注入 */
export interface AuthContext {
  userId: string;
  openId: string;
  nickName: string;
  avatarUrl: string;
}

export interface PaginationQuery {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
}

/** 圈速：对外展示字符串，对内存储毫秒 */
export type LapTimeDisplay = string;

export interface UserProfile {
  id: string;
  nickName: string;
  avatarUrl: string;
  isOrganizer: boolean;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  nickName: string;
  avatarUrl: string;
}

export interface UpdateProfileDto {
  nickName?: string;
  avatarUrl?: string;
}

export interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}
