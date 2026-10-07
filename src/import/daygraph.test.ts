import { argbToHex, daygraphDateToDay, parseDaygraph } from './daygraph';
import { ImportError } from './errors';

describe('daygraphDateToDay', () => {
  test.each([
    [1736895600000, '2025-01-15', 'midnight in Paris, winter'],
    [1752444000000, '2025-07-14', 'midnight in Paris, summer'],
    [1745096400000, '2025-04-20', 'midnight at UTC+3'],
    [1762128000000, '2025-11-03', 'midnight at UTC+0'],
    [1754319600000, '2025-08-05', 'midnight at UTC+9'],
    [1761519600000, '2025-10-27', 'midnight in Paris, the day after DST ends'],
  ])('%d is %s (%s)', (timestamp, day) => {
    expect(daygraphDateToDay(timestamp)).toBe(day);
  });
});

test('argbToHex drops the alpha channel', () => {
  expect(argbToHex('4294941273')).toBe('#FF9A59');
  expect(argbToHex(4280602879)).toBe('#24D0FF');
});

const backup = (overrides: object = {}) => ({
  tasks: [
    { id: 2, title: 'Lire 10 pages', description: null, color: '4280602879', order: 2, positive: true },
    { id: 1, title: 'Marcher 30 minutes', description: null, color: '4294941273', order: 1, positive: true },
    { id: 3, title: 'Méditer', description: null, color: '4283367259', order: 3, positive: true },
  ],
  histories: [
    { id: 360, task: 2, description: null, date: 1745182800000 }, // 21 Apr 2025 at UTC+3
    { id: 365, task: 2, description: null, date: 1745186400000 }, // 21 Apr 2025 in Paris
    { id: 28, task: 1, description: null, date: 1739142000000 }, // 10 Feb 2025 in Paris
  ],
  reminders: [],
  goals: [],
  ...overrides,
});

describe('parseDaygraph', () => {
  test('habits in Daygraph order, mapped to the palette', () => {
    expect(parseDaygraph(backup()).habits).toEqual([
      { sourceId: 1, name: 'Marcher 30 minutes', color: '#F0B35A', sortOrder: 0 },
      { sourceId: 2, name: 'Lire 10 pages', color: '#6E9BF2', sortOrder: 1 },
      { sourceId: 3, name: 'Méditer', color: '#7FD9B4', sortOrder: 2 },
    ]);
  });

  test('the same day ticked in two timezones counts once', () => {
    const result = parseDaygraph(backup());
    expect(result.checks).toEqual([
      { sourceId: 2, day: '2025-04-21' },
      { sourceId: 1, day: '2025-02-10' },
    ]);
    expect(result.duplicates).toBe(1);
    expect(result.firstDay).toBe('2025-02-10');
  });

  test('refuses negative habits', () => {
    const tasks = [{ id: 1, title: 'Fumer', color: '4294941273', order: 1, positive: false }];
    expect(() => parseDaygraph(backup({ tasks, histories: [] }))).toThrow(
      expect.objectContaining({ code: 'negative-habit', params: { name: 'Fumer' } }),
    );
  });

  test('refuses files that are not Daygraph backups', () => {
    expect(() => parseDaygraph({ habits: [] })).toThrow(expect.objectContaining({ code: 'unknown-format' }));
    expect(() => parseDaygraph(backup({ histories: [{ task: 99, date: 0 }] }))).toThrow(ImportError);
    expect(() => parseDaygraph(backup({ histories: [{ task: 99, date: 0 }] }))).toThrow(
      expect.objectContaining({ code: 'invalid-daygraph' }),
    );
  });
});
