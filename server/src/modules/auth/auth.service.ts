import { signJwt, verifyJwt } from '../../lib/jwt.js';
import { config } from '../../config/index.js';
import { UnauthorizedError } from '../../shared/errors.js';
import type { AuthContext, UserProfile } from '../../shared/types.js';
import { wechatClient } from './wechat.client.js';
import { userRepository } from './user.repository.js';

export class AuthService {
  async loginByWechat(code: string): Promise<{ token: string; expiresIn: number; user: UserProfile }> {
    const session = await wechatClient.code2Session(code);

    let user = await userRepository.findByOpenId(session.openId);

    if (!user) {
      user = await userRepository.create({
        openId: session.openId,
        unionId: session.unionId,
      });
    } else if (session.unionId && !user.unionId) {
      user = await userRepository.update(user.id, { unionId: session.unionId });
    }

    const token = this.signToken(user.id);
    const profile = await this.buildUserProfile(user);

    return {
      token,
      expiresIn: config.jwt.expiresIn,
      user: profile,
    };
  }

  async resolveToken(token: string): Promise<AuthContext> {
    let payload: { sub: string };

    try {
      payload = verifyJwt(token, config.jwt.secret);
    } catch {
      throw new UnauthorizedError();
    }

    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError();
    }

    return {
      userId: user.id,
      openId: user.openId,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
    };
  }

  refreshToken(userId: string): { token: string; expiresIn: number } {
    return {
      token: this.signToken(userId),
      expiresIn: config.jwt.expiresIn,
    };
  }

  signToken(userId: string): string {
    return signJwt(userId, config.jwt.secret, config.jwt.expiresIn);
  }

  async buildUserProfile(user: {
    id: string;
    nickName: string;
    avatarUrl: string;
    createdAt: Date;
  }): Promise<UserProfile> {
    const trackCount = await userRepository.countTracksByCreator(user.id);

    return {
      id: user.id,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
      isOrganizer: trackCount > 0,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
