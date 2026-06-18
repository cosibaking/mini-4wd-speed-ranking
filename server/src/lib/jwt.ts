import { createHmac, timingSafeEqual } from 'node:crypto';

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

interface JwtBody {
  sub: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signSegment(headerB64: string, payloadB64: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
}

export function signJwt(subject: string, secret: string, expiresInSeconds: number): string {
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtBody = {
    sub: subject,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signSegment(headerB64, payloadB64, secret);

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyJwt(token: string, secret: string): { sub: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('invalid token');
  }

  const [headerB64, payloadB64, signature] = parts;
  const expected = signSegment(headerB64, payloadB64, secret);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error('invalid signature');
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtBody;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('token expired');
  }

  if (!payload.sub) {
    throw new Error('missing subject');
  }

  return { sub: payload.sub };
}
