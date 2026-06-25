/** 密钥类：仅保留前 8 位 */
export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '(empty)';
  }
  if (trimmed.length <= 8) {
    return '***';
  }
  return `${trimmed.slice(0, 8)}***`;
}

/** 标识符类（openId 等）：保留首尾各 4 位 */
export function maskIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '(empty)';
  }
  if (trimmed.length <= 8) {
    return '***';
  }
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}

/** 连接串：保留协议、用户名、主机、库名，密码替换为 *** */
export function maskConnectionUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '(empty)';
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch {
    return maskSecret(trimmed);
  }
}
