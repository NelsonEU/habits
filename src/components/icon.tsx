import { type AndroidSymbol, type SFSymbol, SymbolView } from 'expo-symbols';
import boldAndroid from 'expo-symbols/androidWeights/bold';
import mediumAndroid from 'expo-symbols/androidWeights/medium';
import semiBoldAndroid from 'expo-symbols/androidWeights/semiBold';

/**
 * Every icon the app uses, by meaning, with its native symbol on each platform: SF Symbols on iOS,
 * Material Symbols on Android (and web). Both names are type-checked against each set.
 * Add icons here rather than passing raw symbol names, so none is ever missing on one platform.
 */
const ICONS = {
  stats: { ios: 'chart.bar', android: 'bar_chart' },
  settings: { ios: 'slider.horizontal.3', android: 'tune' },
  edit: { ios: 'pencil', android: 'edit' },
  back: { ios: 'chevron.left', android: 'chevron_left' },
  forward: { ios: 'chevron.right', android: 'chevron_right' },
  check: { ios: 'checkmark', android: 'check' },
  add: { ios: 'plus', android: 'add' },
  dragHandle: { ios: 'line.3.horizontal', android: 'drag_handle' },
  remove: { ios: 'minus.circle', android: 'do_not_disturb_on' },
  reminder: { ios: 'bell', android: 'notifications' },
  remindersOff: { ios: 'bell.slash', android: 'notifications_off' },
  allowReminders: { ios: 'bell.badge', android: 'notifications_active' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  export: { ios: 'square.and.arrow.up', android: 'upload' },
  import: { ios: 'square.and.arrow.down', android: 'download' },
  undo: { ios: 'arrow.uturn.backward', android: 'undo' },
  mail: { ios: 'envelope', android: 'mail' },
  trendUp: { ios: 'arrow.up', android: 'arrow_upward' },
  trendDown: { ios: 'arrow.down', android: 'arrow_downward' },
  trendSame: { ios: 'equal', android: 'equal' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

const WEIGHTS = {
  medium: { ios: 'medium', android: mediumAndroid },
  semibold: { ios: 'semibold', android: semiBoldAndroid },
  bold: { ios: 'bold', android: boldAndroid },
} as const;

export function Icon({
  name,
  size,
  color,
  weight = 'semibold',
}: {
  name: IconName;
  size: number;
  color: string;
  weight?: keyof typeof WEIGHTS;
}) {
  const { ios, android } = ICONS[name];
  return <SymbolView name={{ ios, android, web: android }} size={size} weight={WEIGHTS[weight]} tintColor={color} />;
}
