import type { MediaType } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import type { MediaPurpose } from './dto/upload-credential.dto.js';

export class MediaRepository {
  async insertPending(data: {
    objectKey: string;
    userId: string;
    mediaType: MediaType;
    purpose: MediaPurpose;
    publicUrl: string;
    fileSize: number;
  }) {
    return prisma.mediaObject.create({
      data: {
        objectKey: data.objectKey,
        userId: data.userId,
        mediaType: data.mediaType,
        purpose: data.purpose,
        publicUrl: data.publicUrl,
        fileSize: data.fileSize,
        status: 'pending',
      },
    });
  }

  async findByObjectKeyAndUser(objectKey: string, userId: string) {
    return prisma.mediaObject.findFirst({
      where: { objectKey, userId },
    });
  }

  async confirm(objectKey: string) {
    return prisma.mediaObject.update({
      where: { objectKey },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });
  }

  async findConfirmed(objectKey: string) {
    return prisma.mediaObject.findFirst({
      where: { objectKey, status: 'confirmed' },
    });
  }

  async deletePendingOlderThan(hours: number): Promise<number> {
    const cutoff = new Date(Date.now() - hours * 3600 * 1000);
    const result = await prisma.mediaObject.deleteMany({
      where: {
        status: 'pending',
        createdAt: { lt: cutoff },
      },
    });
    return result.count;
  }
}

export const mediaRepository = new MediaRepository();
