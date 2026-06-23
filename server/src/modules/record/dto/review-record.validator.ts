import type { ApproveRecordDto, RejectRecordDto } from './record.types';
import { invalidLapTimeError, validationError } from '../errors';

export function validateApproveRecordDto(body: unknown): ApproveRecordDto {
  const dto = body as ApproveRecordDto;
  if (dto?.reviewNote && dto.reviewNote.length > 200) {
    throw validationError('审核备注不超过 200 字');
  }
  return {
    lapTimeDisplay: dto?.lapTimeDisplay?.trim(),
    reviewNote: dto?.reviewNote?.trim(),
  };
}

export function validateRejectRecordDto(body: unknown): RejectRecordDto {
  const dto = body as RejectRecordDto;
  const reviewNote = dto?.reviewNote?.trim();
  if (!reviewNote) {
    throw validationError('拒绝原因为必填项');
  }
  if (reviewNote.length > 200) {
    throw validationError('拒绝原因不超过 200 字');
  }
  return { reviewNote };
}

export { invalidLapTimeError };
