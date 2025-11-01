import * as React from 'react';
import { cn } from '../../lib/cn';

type TextElement = 'p' | 'span' | 'small';
type TextProps<T extends TextElement> = Omit<React.ComponentPropsWithoutRef<T>, 'as'> & {
  muted?: boolean;
  as?: T;
};

export function Text<T extends TextElement = 'p'>({ muted, as, className, ...props }: TextProps<T>) {
  const Comp = (as ?? 'p') as React.ElementType;
  return <Comp className={cn(muted ? 'ds-muted' : undefined, className)} {...props} />;
}
