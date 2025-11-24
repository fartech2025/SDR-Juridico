import * as React from 'react';
import { cn } from '../../lib/cn';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'xl' | 'lg' | 'md' | 'sm';
}

const sizeMap: Record<NonNullable<HeadingProps['size']>, string> = {
  xl: 'text-4xl sm:text-5xl',
  lg: 'text-3xl sm:text-4xl',
  md: 'text-2xl sm:text-3xl',
  sm: 'text-xl sm:text-2xl',
};

export function Heading({ as = 'h1', size = 'lg', className, ...props }: HeadingProps) {
  const Comp = as;
  return <Comp className={cn('ds-heading', sizeMap[size], className)} {...props} />;
}
