import type { Snapshot } from '@/domain/model';
import { daygraphToBackup, parseBackupFile, summarize, toBackupFile } from './backup';

const snapshot: Snapshot = {
  habits: [
    { id: 1, uid: 'u1', name: 'Marcher', color: '#F0B35A', sortOrder: 0, startDay: '2026-01-01', archivedAt: null },
    { id: 2, uid: 'u2', name: 'Lire', color: '#6E9BF2', sortOrder: 1, startDay: '2026-02-01', archivedAt: '2026-09-01T10:00:00.000Z' },
  ],
  checks: new Map([
    [1, new Set(['2026-10-02', '2026-10-01'])],
    [2, new Set(['2026-08-15'])],
  ]),
  filled: new Set(['2026-10-02', '2026-10-01', '2026-10-03']),
};

describe('backup file', () => {
  test('round-trips: what is exported is what is read back', () => {
    const json = JSON.parse(toBackupFile(snapshot, new Date('2026-10-08T20:00:00Z')));
    expect(parseBackupFile(json)).toEqual({
      habits: [
        { uid: 'u1', name: 'Marcher', color: '#F0B35A', startDay: '2026-01-01', archivedAt: null, checks: ['2026-10-01', '2026-10-02'] },
        { uid: 'u2', name: 'Lire', color: '#6E9BF2', startDay: '2026-02-01', archivedAt: '2026-09-01T10:00:00.000Z', checks: ['2026-08-15'] },
      ],
      filledDays: ['2026-10-01', '2026-10-02', '2026-10-03'],
    });
  });

  const valid = () => JSON.parse(toBackupFile(snapshot, new Date('2026-10-08T20:00:00Z')));

  test('refuses files from a newer version of the app', () => {
    expect(() => parseBackupFile({ ...valid(), version: 99 })).toThrow(expect.objectContaining({ code: 'newer-version' }));
  });

  test('refuses damaged files', () => {
    const file = valid();
    file.habits[0].checks = ['2026-02-30'];
    expect(() => parseBackupFile(file)).toThrow(expect.objectContaining({ code: 'invalid-backup' }));
    expect(() => parseBackupFile({ ...valid(), habits: 'nope' })).toThrow(expect.objectContaining({ code: 'invalid-backup' }));
  });

  test('brings hand-edited colors back into the palette', () => {
    const file = valid();
    file.habits[0].color = '#ff9a59';
    expect(parseBackupFile(file).habits[0].color).toBe('#F0B35A');
  });
});

test('daygraphToBackup starts every habit on the first day and fills ticked days', () => {
  const backup = daygraphToBackup(
    {
      habits: [{ sourceId: 7, name: 'Marcher', color: '#F0B35A', sortOrder: 0 }],
      checks: [
        { sourceId: 7, day: '2026-03-02' },
        { sourceId: 7, day: '2026-03-01' },
      ],
      firstDay: '2026-03-01',
      duplicates: 0,
    },
    '2026-10-08',
  );
  expect(backup).toEqual({
    habits: [{ uid: null, name: 'Marcher', color: '#F0B35A', startDay: '2026-03-01', archivedAt: null, checks: ['2026-03-01', '2026-03-02'] }],
    filledDays: ['2026-03-01', '2026-03-02'],
  });
});

test('summarize', () => {
  const backup = parseBackupFile(JSON.parse(toBackupFile(snapshot, new Date())));
  expect(summarize(backup)).toEqual({ habits: 2, checks: 3, first: '2026-08-15', last: '2026-10-02' });
});
