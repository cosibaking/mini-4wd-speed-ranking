import type { LapTimeDisplay } from './types.js';

const LAP_TIME_PATTERN = /^(?:(\d+):)?(\d+(?:\.\d{1,3})?)$/;

/** 全角冒号 → 半角，便于输入不区分 */
function normalizeLapTimeInput(display: string): string {
  return display.trim().replace(/\uFF1A/g, ':');
}

export interface ParsedLapTime {
  lapTimeMs: number;
  lapTimeDisplay: LapTimeDisplay;
}

export function parseLapTime(display: string): ParsedLapTime {
  const trimmed = normalizeLapTimeInput(display);
  const match = LAP_TIME_PATTERN.exec(trimmed);

  if (!match) {
    throw new Error('圈速格式无效');
  }

  const minutes = match[1] ? Number.parseInt(match[1], 10) : 0;
  const seconds = Number.parseFloat(match[2]);
  const lapTimeMs = Math.round((minutes * 60 + seconds) * 1000);

  if (lapTimeMs <= 0) {
    throw new Error('圈速必须大于 0');
  }

  return {
    lapTimeMs,
    lapTimeDisplay: trimmed,
  };
}

export function formatLapTime(lapTimeMs: number): LapTimeDisplay {
  const totalSeconds = lapTimeMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  }

  return seconds.toFixed(3);
}
