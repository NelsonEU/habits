import type { TFunction } from 'i18next';

import type { Rate, Streak } from '@/domain/stats';
import { locale } from '.';
import { monthShort, percent } from './format';

/*
 * The small texts the statistics screens share, so the overview cards and the
 * detail screen always say the same thing the same way.
 */

export const daysValue = (t: TFunction, n: number) => t('stats.daysShort', { count: n });

export const recordValue = (t: TFunction, record: Streak | null) => (record ? daysValue(t, record.length) : t('stats.noValue'));

/** "Record · août 2026", or just "Record" when there is none yet. */
export const recordLabel = (t: TFunction, record: Streak | null) =>
  record ? t('stats.recordOn', { date: `${monthShort(record.end.slice(0, 7), locale)} ${record.end.slice(0, 4)}` }) : t('stats.record');

export const rateValue = (t: TFunction, ratio: number | null) => (ratio === null ? t('stats.noValue') : percent(ratio, locale));

/**
 * The last 30 days compared with the 30 before: which way it went, and the earlier rate
 * ("↓ 87 % avant"). Null when there's no earlier period. Compares the rounded percents
 * shown on screen, so "83 %" next to "83 % avant" is never an arrow.
 */
export function trend(t: TFunction, current: Rate, previous: Rate) {
  if (current.ratio === null || previous.ratio === null) return null;
  const now = Math.round(current.ratio * 100);
  const before = Math.round(previous.ratio * 100);
  const direction: 'up' | 'down' | 'same' = now > before ? 'up' : now < before ? 'down' : 'same';
  const pct = percent(previous.ratio, locale);
  return { direction, pct, text: t('stats.before', { pct }) };
}

/** "73 % des jours tenus en 2026, contre 57 % en 2025 et 51 % en 2024." */
export function progressSentence(t: TFunction, years: { year: number; ratio: number | null }[]): string | null {
  const known = years.filter((y): y is { year: number; ratio: number } => y.ratio !== null);
  const current = known.at(-1);
  if (!current) return null;
  const others = known
    .slice(0, -1)
    .reverse()
    .map((y) => t('stats.yearItem', { pct: percent(y.ratio, locale), year: y.year }));
  const pct = percent(current.ratio, locale);
  if (others.length === 0) return t('stats.progressSentence', { pct, year: current.year });
  const list = others.length === 1 ? others[0] : `${others.slice(0, -1).join(', ')}${t('stats.and')}${others.at(-1)}`;
  return t('stats.progressSentenceVs', { pct, year: current.year, others: list });
}
