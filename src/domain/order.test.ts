import { moveInOrder } from './order';

describe('moveInOrder', () => {
  test('swaps with the neighbor', () => {
    expect(moveInOrder([1, 2, 3], 2, -1)).toEqual([2, 1, 3]);
    expect(moveInOrder([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
  });

  test('does nothing at either end', () => {
    expect(moveInOrder([1, 2, 3], 1, -1)).toEqual([1, 2, 3]);
    expect(moveInOrder([1, 2, 3], 3, 1)).toEqual([1, 2, 3]);
  });

  test('does nothing for an unknown id, and never mutates its input', () => {
    const ids = [1, 2, 3];
    expect(moveInOrder(ids, 9, 1)).toEqual([1, 2, 3]);
    moveInOrder(ids, 1, 1);
    expect(ids).toEqual([1, 2, 3]);
  });
});
