import type { ReviewGrade, SM2Result } from "@/types/reading";

/**
 * SM-2 间隔重复算法实现
 * 
 * 用户评分：
 * 1 = 忘记 → 间隔重置为1天，repetition=0，easeFactor - 0.2
 * 2 = 困难 → 间隔按原interval × 1.2，repetition+1，easeFactor - 0.15
 * 3 = 良好 → 间隔按 SM-2 公式计算，repetition+1
 * 4 = 简单 → 间隔按 SM-2 公式计算，repetition+1，easeFactor + 0.15
 */

const MIN_EASE_FACTOR = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateSM2(
  grade: ReviewGrade,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetition: number
): SM2Result {
  let easeFactor = currentEaseFactor;
  let interval: number;
  let repetition: number;

  switch (grade) {
    case 1: // 忘记
      repetition = 0;
      interval = 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      break;

    case 2: // 困难
      repetition = currentRepetition + 1;
      interval = Math.max(1, Math.round(currentInterval * 1.2));
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
      break;

    case 3: // 良好
      repetition = currentRepetition + 1;
      if (repetition === 1) {
        interval = 1;
      } else if (repetition === 2) {
        interval = 6;
      } else {
        interval = Math.round(currentInterval * easeFactor);
      }
      break;

    case 4: // 简单
      repetition = currentRepetition + 1;
      if (repetition === 1) {
        interval = 1;
      } else if (repetition === 2) {
        interval = 6;
      } else {
        interval = Math.round(currentInterval * easeFactor * 1.3);
      }
      easeFactor = easeFactor + 0.15;
      break;

    default:
      repetition = currentRepetition;
      interval = currentInterval;
  }

  // 确保 easeFactor 不低于最小值
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

  // 计算下次复习时间
  const nextReviewAt = new Date(Date.now() + interval * DAY_MS).toISOString();

  return {
    ease_factor: parseFloat(easeFactor.toFixed(2)),
    interval_days: interval,
    repetition_count: repetition,
    next_review_at: nextReviewAt,
  };
}

/**
 * 获取今日待复习的闪卡数量
 */
export function getDueFlashcardsQuery() {
  return {
    filter: { next_review_at: { lte: new Date().toISOString() } },
  };
}
