import { Text as RNText, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

/** Text in the app font and color. React Native text doesn't inherit fonts, so use this instead of <Text>. */
export function Text({ className, ...props }: TextProps) {
  return <RNText className={cn('font-sans text-[15px] leading-[21px] text-ink', className)} {...props} />;
}

/** Screen title in the display font. */
export function Title({ className, ...props }: TextProps) {
  return (
    <RNText
      accessibilityRole="header"
      className={cn('font-display text-[38px] font-bold leading-[42px] tracking-[-0.76px] text-ink', className)}
      {...props}
    />
  );
}
