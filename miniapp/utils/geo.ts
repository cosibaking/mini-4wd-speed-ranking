/** 地理距离计算 */

const EARTH_RADIUS_M = 6371000;

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

/** 获取用户当前位置 */
export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => resolve({ lat: res.latitude, lng: res.longitude }),
      fail: reject,
    });
  });
}

/** 打开地图导航 */
export function openNavigation(
  name: string,
  lat: number,
  lng: number,
  address: string
): void {
  wx.openLocation({
    latitude: lat,
    longitude: lng,
    name,
    address,
    scale: 16,
  });
}
