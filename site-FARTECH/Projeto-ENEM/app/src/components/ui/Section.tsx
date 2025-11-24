import * as React from 'react';
import { cn } from '../../lib/cn';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export function Section({ className, ...props }: SectionProps) {
  return <section className={cn('w-full py-6 sm:py-8', className)} {...props} />;
}
