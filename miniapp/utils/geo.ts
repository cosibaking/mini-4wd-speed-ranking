/** 地理距离计算 */

import { request } from '../services/http';

const EARTH_RADIUS_M = 6371000;

/** 地图默认中心（北京），未填经纬度时 map 组件的默认值 */
export const DEFAULT_MAP_CENTER = { latitude: 39.9042, longitude: 116.4074 };

export const MAP_MARKER_ICON = '/assets/map/marker.png';

export interface MapMarker {
  id: number;
  latitude: number;
  longitude: number;
  iconPath: string;
  width: number;
  height: number;
  callout?: {
    content: string;
    display: 'ALWAYS' | 'BYCLICK';
    padding: number;
    borderRadius: number;
    fontSize?: number;
    borderWidth?: number;
    borderColor?: string;
    bgColor?: string;
    color?: string;
  };
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine 距离（米） */
export function calcDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 格式化为可读距离 */
export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** 获取用户当前位置（gcj02 火星坐标系，与 map 组件一致） */
export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => resolve({ lat: res.latitude, lng: res.longitude }),
      fail: reject,
    });
  });
}

/** 带超时的定位，避免阻塞列表加载 */
export async function tryGetUserLocation(
  timeoutMs = 2500
): Promise<{ lat: number; lng: number } | undefined> {
  try {
    return await Promise.race([
      getUserLocation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('location timeout')), timeoutMs);
      }),
    ]);
  } catch {
    return undefined;
  }
}

/** 构建赛道标记点 */
export function buildTrackMarker(lat: number, lng: number, title: string): MapMarker {
  return {
    id: 1,
    latitude: lat,
    longitude: lng,
    iconPath: MAP_MARKER_ICON,
    width: 32,
    height: 42,
    callout: {
      content: title,
      display: 'ALWAYS',
      padding: 8,
      borderRadius: 6,
      fontSize: 12,
      borderWidth: 1,
      borderColor: '#E85D04',
      bgColor: '#ffffff',
      color: '#333333',
    },
  };
}

export interface MapNavOptions {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

function openWechatMap({ name, lat, lng, address }: MapNavOptions): void {
  wx.openLocation({
    latitude: lat,
    longitude: lng,
    name,
    address,
    scale: 16,
  });
}

/**
 * 通过 MapContext.openMapApp 拉起地图 App 选择导航。
 * 需页面存在 id 与 mapId 一致的 map 组件。
 */
export function openMapNavigation(mapId: string, options: MapNavOptions): void {
  const ctx = wx.createMapContext(mapId);
  ctx.openMapApp({
    latitude: options.lat,
    longitude: options.lng,
    destination: options.name || options.address,
    fail: () => {
      openWechatMap(options);
    },
  });
}

function openMapMiniProgram(appId: string, path: string, appName: string): void {
  wx.navigateToMiniProgram({
    appId,
    path,
    fail: () => {
      wx.showToast({ title: `无法打开${appName}`, icon: 'none' });
    },
  });
}

function openTencentMap(opts: MapNavOptions): void {
  const name = encodeURIComponent(opts.name || opts.address);
  openMapMiniProgram(
    'wx5bc2ae712e694a62',
    `/modules/routePlan/pages/index/index?type=drive&to=${name}&tocoord=${opts.lat},${opts.lng}`,
    '腾讯地图'
  );
}

function openAmap(opts: MapNavOptions): void {
  const name = encodeURIComponent(opts.name || opts.address);
  openMapMiniProgram(
    'wx7646beb07707391a',
    `/pages/index/index?type=route&dest=${opts.lng},${opts.lat}&destName=${name}`,
    '高德地图'
  );
}

function openBaiduMap(opts: MapNavOptions): void {
  const name = encodeURIComponent(opts.name || opts.address);
  openMapMiniProgram(
    'wx93ce83f128d17374',
    `/pages/index/index?type=nav&dest=${opts.lat},${opts.lng}&destName=${name}`,
    '百度地图'
  );
}

/** @deprecated 请使用 openMapNavigation */
export function showMapNavigationPicker(options: MapNavOptions): void {
  const systemInfo = wx.getSystemInfoSync();
  const apps: Array<{ name: string; open: () => void }> = [
    { name: '微信地图', open: () => openWechatMap(options) },
    { name: '腾讯地图', open: () => openTencentMap(options) },
    { name: '高德地图', open: () => openAmap(options) },
    { name: '百度地图', open: () => openBaiduMap(options) },
  ];

  if (systemInfo.platform === 'ios') {
    apps.push({ name: 'Apple 地图', open: () => openWechatMap(options) });
  }

  wx.showActionSheet({
    itemList: apps.map((app) => app.name),
    success: (res) => {
      const app = apps[res.tapIndex];
      if (app) app.open();
    },
  });
}

/** @deprecated 请使用 openMapNavigation */
export function openNavigation(
  name: string,
  lat: number,
  lng: number,
  address: string
): void {
  showMapNavigationPicker({ name, lat, lng, address });
}

/** 坐标逆地理编码（map 选点未返回地址时使用） */
export function reverseGeocodeAddress(lat: number, lng: number): Promise<string> {
  return request<{ address: string }>(`/geo/reverse?lat=${lat}&lng=${lng}`, { auth: false }).then(
    (res) => res.address
  );
}

export interface PlaceSearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

function buildGeoBiasQuery(lat?: number, lng?: number): string {
  if (lat === undefined || lng === undefined) {
    return '';
  }
  return `&lat=${lat}&lng=${lng}`;
}

/** 关键词搜索地点（坐标来自腾讯 POI 数据，与列表一致） */
export function searchPlacesByKeyword(
  keyword: string,
  lat?: number,
  lng?: number
): Promise<PlaceSearchResult[]> {
  const q = encodeURIComponent(keyword);
  return request<{ places: PlaceSearchResult[] }>(
    `/geo/search?keyword=${q}${buildGeoBiasQuery(lat, lng)}`,
    { auth: false }
  ).then((res) => res.places);
}

/** 关键词联想（输入时实时提示） */
export function suggestPlacesByKeyword(
  keyword: string,
  lat?: number,
  lng?: number
): Promise<PlaceSearchResult[]> {
  const q = encodeURIComponent(keyword);
  return request<{ places: PlaceSearchResult[] }>(
    `/geo/suggest?keyword=${q}${buildGeoBiasQuery(lat, lng)}`,
    { auth: false }
  ).then((res) => res.places);
}
