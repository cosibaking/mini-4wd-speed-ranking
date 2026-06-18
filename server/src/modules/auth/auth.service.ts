import type { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../../config/index.js';
import { prisma } from '../../lib/prisma.js';
import { UnauthorizedError } from '../../shared/errors.js';
import type { AuthContext, JwtPayload, UserProfile } from '../../shared/types.js';
import { wechatClient } from './wechat.client.js';

export class AuthService {
  async loginByWechat(code: string): Promise<{ token: string; expiresIn: number; user: UserProfile }> {
    const session = await wechatClient.code2Session(code);

    let user = await prisma.user.findUnique({
      where: { openId: session.openId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          openId: session.openId,
          unionId: session.unionId,
        },
      });
    } else if (session.unionId && !user.unionId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { unionId: session.unionId },
      });
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
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw new UnauthorizedError();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

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
    return jwt.sign({}, config.jwt.secret, {
      subject: userId,
      expiresIn: config.jwt.expiresIn,
    });
  }

  async buildUserProfile(user: User): Promise<UserProfile> {
    const trackCount = await prisma.track.count({
      where: { creatorId: user.id },
    });

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
