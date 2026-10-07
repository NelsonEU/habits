import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { type Day, toDay } from '@/domain/day';

/**
 * Today's date, kept current: re-read when the app comes back to the
 * foreground (it may have slept overnight) and at midnight while open.
 */
export function useToday(): Day {
  const [today, setToday] = useState(() => toDay(new Date()));

  useEffect(() => {
    const refresh = () => setToday(toDay(new Date()));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(refresh, nextMidnight.getTime() - now.getTime() + 1000);
    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}
